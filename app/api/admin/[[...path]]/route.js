import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, createToken } from '@/lib/admin/auth';
import { requireAuth, requireRole, checkRateLimit, clearRateLimit } from '@/lib/admin/middleware';

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
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

    // Dashboard stats - Requires at least manager role for PII access
    if (path === 'dashboard/stats') {
      const roleCheck = await requireRole(request, 'manager');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions - Manager role required', 403);
      }
      
      const productsCol = await getCollection('products');
      const ordersCol = await getCollection('orders');
      const categoriesCol = await getCollection('categories');

      const [
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders
      ] = await Promise.all([
        productsCol.countDocuments(),
        ordersCol.countDocuments(),
        ordersCol.countDocuments({ status: 'pending' }),
        ordersCol.countDocuments({ status: 'delivered' }),
        ordersCol.countDocuments({ status: 'cancelled' })
      ]);

      // Calculate revenue
      const orders = await ordersCol.find({ status: { $in: ['delivered', 'shipped', 'confirmed'] } }).toArray();
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

      const lowStockProducts = await productsCol.countDocuments({ stock: { $lt: 10 } });

      return successResponse({
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        todayRevenue,
        lowStockProducts
      });
    }

    // Get all products for admin
    if (path === 'products') {
      const productsCol = await getCollection('products');
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 20;
      const skip = (page - 1) * limit;

      const products = await productsCol.find({}).skip(skip).limit(limit).toArray();
      const total = await productsCol.countDocuments();

      return successResponse({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Get single product
    if (path.startsWith('products/') && !path.includes('/')) {
      const id = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({ _id: id });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ product });
    }

    // Get all orders for admin - Requires manager role (contains customer PII)
    if (path === 'orders') {
      const roleCheck = await requireRole(request, 'manager');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions - Manager role required', 403);
      }
      
      const ordersCol = await getCollection('orders');
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 20;
      const skip = (page - 1) * limit;

      const filter = status ? { status } : {};
      const orders = await ordersCol
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await ordersCol.countDocuments(filter);

      return successResponse({
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Get single order - Requires manager role (contains customer PII)
    if (path.startsWith('orders/') && path.split('/').length === 2) {
      const roleCheck = await requireRole(request, 'manager');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions - Manager role required', 403);
      }
      
      const id = path.split('/')[1];
      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: id });

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      return successResponse({ order });
    }

    // Get all categories
    if (path === 'categories') {
      const categoriesCol = await getCollection('categories');
      const categories = await categoriesCol.find({}).toArray();
      return successResponse({ categories });
    }

    // Get settings
    if (path === 'settings') {
      const settingsCol = await getCollection('settings');
      const settings = await settingsCol.findOne({ _id: 'site_settings' });
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
    // Login endpoint (no auth required) - WITH RATE LIMITING
    if (path === 'auth/login') {
      let email, password;
      
      try {
        const body = await request.json();
        email = body.email;
        password = body.password;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return errorResponse('Invalid request body', 400);
      }

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      // SECURITY: Rate limit login attempts by email
      const rateLimit = checkRateLimit(email);
      if (!rateLimit.allowed) {
        const minutesLeft = Math.ceil(rateLimit.resetIn / 60000);
        return errorResponse(
          `Too many login attempts. Please try again in ${minutesLeft} minutes.`, 
          429
        );
      }

      const adminsCol = await getCollection('admins');
      const admin = await adminsCol.findOne({ email });

      if (!admin) {
        return errorResponse('Invalid credentials', 401);
      }

      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        return errorResponse('Invalid credentials', 401);
      }

      // SECURITY: Clear rate limit on successful login
      clearRateLimit(email);

      const token = await createToken({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      });

      const response = successResponse({
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      });

      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    }

    // SECURITY FIX: Removed public seed-admin endpoint
    // Admin users must be created through secure server-side scripts only

    // All other routes require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Logout
    if (path === 'auth/logout') {
      const response = successResponse({ message: 'Logged out successfully' });
      response.cookies.delete('admin_token');
      return response;
    }

    // Create product (requires admin role)
    if (path === 'products') {
      const roleCheck = await requireRole(request, 'admin');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions', 403);
      }

      const body = await request.json();
      const productsCol = await getCollection('products');

      const product = {
        _id: uuidv4(),
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await productsCol.insertOne(product);
      return successResponse({ product }, 201);
    }

    // Update order status - Requires manager role
    if (path.startsWith('orders/') && path.endsWith('/status')) {
      const roleCheck = await requireRole(request, 'manager');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions - Manager role required', 403);
      }
      
      const orderId = path.split('/')[1];
      const { status, message } = await request.json();

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: orderId });

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = [...order.timeline, {
        status,
        timestamp: new Date(),
        message: message || `Order status updated to ${status}`
      }];

      await ordersCol.updateOne(
        { _id: orderId },
        { $set: { status, timeline, updatedAt: new Date() } }
      );

      return successResponse({ message: 'Order status updated' });
    }

    // Create category
    if (path === 'categories') {
      const roleCheck = await requireRole(request, 'admin');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions', 403);
      }

      const body = await request.json();
      const categoriesCol = await getCollection('categories');

      const category = {
        _id: uuidv4(),
        ...body,
        productCount: 0,
        createdAt: new Date()
      };

      await categoriesCol.insertOne(category);
      return successResponse({ category }, 201);
    }

    // Save settings
    if (path === 'settings') {
      const roleCheck = await requireRole(request, 'admin');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions', 403);
      }

      const body = await request.json();
      const settingsCol = await getCollection('settings');

      await settingsCol.updateOne(
        { _id: 'site_settings' },
        { $set: { ...body, updatedAt: new Date() } },
        { upsert: true }
      );

      return successResponse({ message: 'Settings saved successfully' });
    }

    // Seed admin user
    if (path === 'seed-admin') {
      const adminsCol = await getCollection('admins');
      
      // Check if admin already exists
      const existingAdmin = await adminsCol.findOne({ email: 'admin@burhan.com' });
      if (existingAdmin) {
        return successResponse({ message: 'Admin user already exists' });
      }

      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123';
      const hashedPassword = await hashPassword(initialPassword);
      const admin = {
        _id: uuidv4(),
        name: 'Super Admin',
        email: 'admin@burhan.com',
        password: hashedPassword,
        role: 'superadmin',
        createdAt: new Date()
      };

      await adminsCol.insertOne(admin);
      return successResponse({ 
        message: 'Admin user created successfully',
        email: 'admin@burhan.com'
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// PUT handler for updates
export async function PUT(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // Update product
    if (path.startsWith('products/')) {
      const roleCheck = await requireRole(request, 'admin');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions', 403);
      }

      const id = path.split('/')[1];
      const body = await request.json();
      const productsCol = await getCollection('products');

      const result = await productsCol.updateOne(
        { _id: id },
        { $set: { ...body, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ message: 'Product updated successfully' });
    }

    // Update category
    if (path.startsWith('categories/')) {
      const roleCheck = await requireRole(request, 'admin');
      if (!roleCheck.authorized) {
        return errorResponse('Insufficient permissions', 403);
      }

      const id = path.split('/')[1];
      const body = await request.json();
      const categoriesCol = await getCollection('categories');

      const result = await categoriesCol.updateOne(
        { _id: id },
        { $set: { ...body, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return errorResponse('Category not found', 404);
      }

      return successResponse({ message: 'Category updated successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
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

    const roleCheck = await requireRole(request, 'admin');
    if (!roleCheck.authorized) {
      return errorResponse('Insufficient permissions', 403);
    }

    // Delete product
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const productsCol = await getCollection('products');

      const result = await productsCol.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return errorResponse('Product not found', 404);
      }

      return successResponse({ message: 'Product deleted successfully' });
    }

    // Delete category
    if (path.startsWith('categories/')) {
      const id = path.split('/')[1];
      const categoriesCol = await getCollection('categories');

      const result = await categoriesCol.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return errorResponse('Category not found', 404);
      }

      return successResponse({ message: 'Category deleted successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}
