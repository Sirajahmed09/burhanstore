import { NextResponse } from 'next/server';
import { getCollection, getDatabaseStatus } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, createToken } from '@/lib/admin/auth';
import {
  requireAuth,
  requireRole,
  isRateLimited,
  recordFailedAttempt,
  clearRateLimit
} from '@/lib/admin/middleware';

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET handler for admin endpoints
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    // Check authentication for all admin routes
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Verify current user session
    if (path === 'auth/me') {
      return successResponse({ user: auth.user });
    }

    // Dashboard stats
    if (path === 'dashboard/stats') {
      const productsCol = await getCollection('products');
      const ordersCol = await getCollection('orders');
      const categoriesCol = await getCollection('categories');

      const allProducts = await productsCol.find({}).toArray();
      const allOrders = await ordersCol.find({}).toArray();

      const totalProducts = allProducts.length;
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
      const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;

      // Revenue calculation
      const revenueOrders = allOrders.filter(o => ['delivered', 'shipped', 'confirmed'].includes(o.status));
      const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = allOrders.filter(order => new Date(order.createdAt) >= today);
      const todayRevenue = todayOrders
        .filter(o => ['delivered', 'shipped', 'confirmed'].includes(o.status))
        .reduce((sum, order) => sum + (order.total || 0), 0);

      // Low stock (< 10) & Out of stock (<= 0) products
      const outOfStockProducts = allProducts.filter(p => (Number(p.stock) || 0) <= 0);
      const lowStockProducts = allProducts.filter(p => {
        const stock = Number(p.stock) || 0;
        return stock > 0 && stock < 10;
      });

      // Recent products (sorted by updatedAt or createdAt desc)
      const recentProducts = [...allProducts]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 6);

      // Recent orders
      const recentOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      return successResponse({
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        todayRevenue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockAlerts: [...outOfStockProducts, ...lowStockProducts].slice(0, 10),
        recentProducts,
        recentOrders,
        database: getDatabaseStatus()
      });
    }

    // Health & Database diagnostic endpoint
    if (path === 'health' || path === 'system/status') {
      const dbStatus = getDatabaseStatus();
      return successResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        database: dbStatus
      });
    }

    // Get single product: /api/admin/products/:id
    if (path.startsWith('products/') && path.split('/').length === 2) {
      const id = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({
        $or: [{ _id: id }, { slug: id }]
      });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ product });
    }

    // Get all products with search, filtering and pagination
    if (path === 'products') {
      const productsCol = await getCollection('products');
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 100;
      const search = searchParams.get('search')?.trim();
      const category = searchParams.get('category');
      const stockStatus = searchParams.get('stockStatus'); // 'low', 'out', 'in'

      const filter = {};
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      let allMatching = await productsCol.find(filter).toArray();

      if (stockStatus === 'out') {
        allMatching = allMatching.filter(p => (Number(p.stock) || 0) <= 0);
      } else if (stockStatus === 'low') {
        allMatching = allMatching.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) < 10);
      } else if (stockStatus === 'in') {
        allMatching = allMatching.filter(p => (Number(p.stock) || 0) >= 10);
      }

      // Sort newest first
      allMatching.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

      const total = allMatching.length;
      const skip = (page - 1) * limit;
      const paginatedProducts = allMatching.slice(skip, skip + limit);

      return successResponse({
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Get all categories
    if (path === 'categories') {
      const categoriesCol = await getCollection('categories');
      const productsCol = await getCollection('products');

      const [categories, products] = await Promise.all([
        categoriesCol.find({}).toArray(),
        productsCol.find({}).toArray()
      ]);

      // Calculate fresh product counts
      const countsMap = {};
      for (const p of products) {
        if (p.category) {
          countsMap[p.category] = (countsMap[p.category] || 0) + 1;
        }
      }

      const updatedCategories = categories.map(cat => ({
        ...cat,
        productCount: countsMap[cat.name] || 0
      }));

      return successResponse({ categories: updatedCategories });
    }

    // Get single category: /api/admin/categories/:id
    if (path.startsWith('categories/') && path.split('/').length === 2) {
      const id = path.split('/')[1];
      const categoriesCol = await getCollection('categories');
      const category = await categoriesCol.findOne({
        $or: [{ _id: id }, { slug: id }]
      });

      if (!category) {
        return errorResponse('Category not found', 404);
      }

      return successResponse({ category });
    }

    // Orders endpoints
    if (path === 'orders') {
      const ordersCol = await getCollection('orders');
      const status = searchParams.get('status');
      const filter = status ? { status } : {};
      const orders = await ordersCol.find(filter).sort({ createdAt: -1 }).toArray();

      return successResponse({
        orders,
        total: orders.length
      });
    }

    if (path.startsWith('orders/') && path.split('/').length === 2) {
      const id = path.split('/')[1];
      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: id });

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      return successResponse({ order });
    }

    // Settings endpoint
    if (path === 'settings') {
      const settingsCol = await getCollection('settings');
      const settings = await settingsCol.findOne({ type: 'general' });
      return successResponse({ settings: settings || {} });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// POST handler for admin endpoints
export async function POST(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    // 1. Admin Login Endpoint (No Auth Required)
    if (path === 'auth/login') {
      let email, password;

      try {
        const body = await request.json();
        email = body.email;
        password = body.password;
      } catch (parseError) {
        return errorResponse('Invalid request format', 400);
      }

      if (!email || !password) {
        return errorResponse('Email/Username and password are required', 400);
      }

      const cleanEmail = email.trim().toLowerCase();

      // SECURITY: Check brute force lockout (5+ failed attempts)
      const rateLimitStatus = isRateLimited(cleanEmail);
      if (rateLimitStatus.locked) {
        const minutesLeft = Math.ceil(rateLimitStatus.resetIn / 60000);
        return errorResponse(
          `Security lockout: Too many failed login attempts. Please try again in ${minutesLeft} minute(s).`,
          429
        );
      }

      const adminsCol = await getCollection('admins');

      // Look up admin by email or identifier
      let admin = await adminsCol.findOne({
        $or: [
          { email: cleanEmail },
          { email: email.trim() }
        ]
      });

      // If remote MongoDB without pre-seeded accounts, auto-seed burhan@store with hashed password
      if (!admin && cleanEmail === 'burhan@store') {
        const passwordHash = process.env.ADMIN_INITIAL_PASSWORD
          ? await hashPassword(process.env.ADMIN_INITIAL_PASSWORD)
          : '$2a$10$TkWPJq8jg0cD7LJ1iwd1UOAOM9PWHxNRxBwZ3b41vdbjO4xpZxI7e';

        const newAdmin = {
          _id: 'admin-burhan-owner',
          name: 'Burhan Store Owner',
          email: 'burhan@store',
          password: passwordHash,
          role: 'superadmin',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await adminsCol.insertOne(newAdmin);
        admin = newAdmin;
      }

      if (!admin) {
        recordFailedAttempt(cleanEmail);
        return errorResponse('Invalid credentials', 401);
      }

      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        recordFailedAttempt(cleanEmail);
        return errorResponse('Invalid credentials', 401);
      }

      // Password is correct - clear failed attempts
      clearRateLimit(cleanEmail);

      const token = await createToken({
        id: admin._id,
        email: admin.email,
        name: admin.name || 'Admin',
        role: admin.role || 'admin'
      });

      const response = successResponse({
        success: true,
        token,
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name || 'Admin',
          role: admin.role || 'admin'
        }
      });

      // Set secure HTTP-only cookie
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return response;
    }

    // 2. Admin Logout Endpoint
    if (path === 'auth/logout') {
      const response = successResponse({ message: 'Logged out successfully' });
      response.cookies.set('admin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });
      return response;
    }

    // All subsequent admin routes require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // 3. Create Product Endpoint
    if (path === 'products') {
      const body = await request.json();
      const productsCol = await getCollection('products');
      const categoriesCol = await getCollection('categories');

      if (!body.name || !body.category || body.price === undefined) {
        return errorResponse('Product name, category, and price are required', 400);
      }

      const price = parseFloat(body.price) || 0;
      const oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
      const discount = oldPrice && oldPrice > price
        ? Math.round(((oldPrice - price) / oldPrice) * 100)
        : (parseFloat(body.discount) || 0);

      const images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []);
      const thumbnail = body.thumbnail || images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';

      const sku = (body.sku && body.sku.trim()) || `BUR-${Math.floor(100000 + Math.random() * 900000)}`;
      const baseSlug = slugify(body.name);
      const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newProduct = {
        _id: uuidv4(),
        name: body.name.trim(),
        slug: body.slug ? slugify(body.slug) : uniqueSlug,
        sku,
        category: body.category,
        price,
        oldPrice,
        discount,
        stock: parseInt(body.stock, 10) >= 0 ? parseInt(body.stock, 10) : 10,
        description: body.description || '',
        features: Array.isArray(body.features) ? body.features : [],
        specifications: body.specifications || {},
        images: images.length > 0 ? images : [thumbnail],
        thumbnail,
        status: body.status || 'active', // 'active' or 'inactive'
        isActive: body.status ? body.status === 'active' : (body.isActive !== false),
        isFeatured: Boolean(body.isFeatured),
        isTrending: Boolean(body.isTrending),
        isNew: body.isNew !== undefined ? Boolean(body.isNew) : true,
        rating: 5,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: auth.user.email
      };

      await productsCol.insertOne(newProduct);

      // Increment category productCount
      await categoriesCol.updateOne(
        { name: newProduct.category },
        { $inc: { productCount: 1 } }
      );

      return successResponse({ success: true, product: newProduct }, 201);
    }

    // 4. Create Category Endpoint
    if (path === 'categories') {
      const body = await request.json();
      const categoriesCol = await getCollection('categories');

      if (!body.name) {
        return errorResponse('Category name is required', 400);
      }

      const slug = body.slug ? slugify(body.slug) : slugify(body.name);
      const newCategory = {
        _id: uuidv4(),
        name: body.name.trim(),
        slug,
        description: body.description || '',
        image: body.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
        productCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await categoriesCol.insertOne(newCategory);
      return successResponse({ success: true, category: newCategory }, 201);
    }

    // 5. Update Order Status
    if (path.startsWith('orders/') && path.endsWith('/status')) {
      const orderId = path.split('/')[1];
      const { status, message } = await request.json();

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: orderId });

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = Array.isArray(order.timeline) ? order.timeline : [];
      timeline.push({
        status,
        timestamp: new Date(),
        message: message || `Status updated to ${status}`
      });

      await ordersCol.updateOne(
        { _id: orderId },
        { $set: { status, timeline, updatedAt: new Date() } }
      );

      return successResponse({ success: true, message: 'Order status updated' });
    }

    // 6. Save Settings
    if (path === 'settings') {
      const body = await request.json();
      const settingsCol = await getCollection('settings');

      await settingsCol.updateOne(
        { type: 'general' },
        { $set: { ...body, updatedAt: new Date() } },
        { upsert: true }
      );

      return successResponse({ success: true, message: 'Settings saved successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// PUT handler for full updates
export async function PUT(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Update order status via PUT
    if (path.startsWith('orders/') && (path.endsWith('/status') || path.split('/').length === 2)) {
      const orderId = path.split('/')[1];
      const body = await request.json();
      const status = body.status;
      const message = body.message;

      if (!status) {
        return errorResponse('Status is required', 400);
      }

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: orderId });
      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = Array.isArray(order.timeline) ? order.timeline : [];
      timeline.push({
        status,
        timestamp: new Date(),
        message: message || `Status updated to ${status}`
      });

      await ordersCol.updateOne(
        { _id: orderId },
        { $set: { status, timeline, updatedAt: new Date() } }
      );

      return successResponse({ success: true, message: 'Order status updated' });
    }

    // Update product
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      const productsCol = await getCollection('products');

      const existing = await productsCol.findOne({ _id: id });
      if (!existing) {
        return errorResponse('Product not found', 404);
      }

      const price = body.price !== undefined ? parseFloat(body.price) : existing.price;
      const oldPrice = body.oldPrice !== undefined ? (body.oldPrice ? parseFloat(body.oldPrice) : null) : existing.oldPrice;
      const discount = oldPrice && oldPrice > price
        ? Math.round(((oldPrice - price) / oldPrice) * 100)
        : (body.discount !== undefined ? parseFloat(body.discount) : existing.discount || 0);

      const images = Array.isArray(body.images) ? body.images : existing.images;
      const thumbnail = body.thumbnail || images[0] || existing.thumbnail;
      const stock = body.stock !== undefined ? parseInt(body.stock, 10) : existing.stock;
      const status = body.status || (body.isActive !== undefined ? (body.isActive ? 'active' : 'inactive') : existing.status || 'active');

      const updateData = {
        ...body,
        price,
        oldPrice,
        discount,
        stock,
        images,
        thumbnail,
        status,
        isActive: status === 'active',
        updatedAt: new Date()
      };
      delete updateData._id;

      await productsCol.updateOne({ _id: id }, { $set: updateData });
      return successResponse({ success: true, message: 'Product updated successfully' });
    }

    // Update category
    if (path.startsWith('categories/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      const categoriesCol = await getCollection('categories');

      const updateData = {
        ...body,
        updatedAt: new Date()
      };
      delete updateData._id;

      const result = await categoriesCol.updateOne({ _id: id }, { $set: updateData });
      if (result.matchedCount === 0) {
        return errorResponse('Category not found', 404);
      }

      return successResponse({ success: true, message: 'Category updated successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// PATCH handler for quick updates (price, stock, status toggle)
export async function PATCH(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Quick product update (price, stock, status toggle)
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      const productsCol = await getCollection('products');

      const existing = await productsCol.findOne({ _id: id });
      if (!existing) {
        return errorResponse('Product not found', 404);
      }

      const updateSet = { updatedAt: new Date() };

      if (body.price !== undefined) {
        updateSet.price = parseFloat(body.price);
        if (body.oldPrice !== undefined) {
          updateSet.oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
        }
        if (updateSet.oldPrice && updateSet.oldPrice > updateSet.price) {
          updateSet.discount = Math.round(((updateSet.oldPrice - updateSet.price) / updateSet.oldPrice) * 100);
        }
      }

      if (body.stock !== undefined) {
        updateSet.stock = Math.max(0, parseInt(body.stock, 10));
      }

      if (body.status !== undefined) {
        updateSet.status = body.status;
        updateSet.isActive = body.status === 'active';
      }

      if (body.isFeatured !== undefined) updateSet.isFeatured = Boolean(body.isFeatured);
      if (body.isTrending !== undefined) updateSet.isTrending = Boolean(body.isTrending);
      if (body.isNew !== undefined) updateSet.isNew = Boolean(body.isNew);

      await productsCol.updateOne({ _id: id }, { $set: updateSet });

      return successResponse({
        success: true,
        message: 'Product updated successfully',
        updated: updateSet
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin PATCH Error:', error);
    return errorResponse(error.message);
  }
}

// DELETE handler
export async function DELETE(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Delete product
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const productsCol = await getCollection('products');
      const categoriesCol = await getCollection('categories');

      const product = await productsCol.findOne({ _id: id });
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      await productsCol.deleteOne({ _id: id });

      // Decrement category product count
      if (product.category) {
        await categoriesCol.updateOne(
          { name: product.category },
          { $inc: { productCount: -1 } }
        );
      }

      return successResponse({ success: true, message: 'Product permanently deleted' });
    }

    // Delete category
    if (path.startsWith('categories/')) {
      const id = path.split('/')[1];
      const categoriesCol = await getCollection('categories');

      const result = await categoriesCol.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        return errorResponse('Category not found', 404);
      }

      return successResponse({ success: true, message: 'Category deleted successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}
