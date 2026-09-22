import { NextResponse } from 'next/server';
import { getCollection, getDatabaseStatus, buildIdQuery } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, createToken } from '@/lib/admin/auth';
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireOwner,
  isRateLimited,
  recordFailedAttempt,
  clearRateLimit
} from '@/lib/admin/middleware';
import {
  ROLES,
  doesActionRequireApproval,
  hasPermission,
  ROLE_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS
} from '@/lib/admin/permissions';
import { logAuditEvent } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function errorResponse(message, status = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: NO_CACHE_HEADERS }
  );
}

function successResponse(data, status = 200) {
  return NextResponse.json(
    data,
    { status, headers: NO_CACHE_HEADERS }
  );
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

// =========================================================================
// GET handler for admin endpoints
// =========================================================================
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    // Check authentication for all admin routes
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // 1. Current user session profile & effective permissions
    if (path === 'auth/me') {
      const user = auth.user;
      const effectivePerms = (user.role === ROLES.OWNER || user.role === 'superadmin')
        ? ALL_PERMISSIONS
        : (Array.isArray(user.permissions) ? user.permissions : (ROLE_DEFAULT_PERMISSIONS[user.role] || []));

      return successResponse({
        user: {
          ...user,
          effectivePermissions: effectivePerms
        }
      });
    }

    // 2. Dashboard stats (with pending approvals count for owner/manager)
    if (path === 'dashboard/stats') {
      const productsCol = await getCollection('products');
      const ordersCol = await getCollection('orders');
      const categoriesCol = await getCollection('categories');
      const approvalsCol = await getCollection('approvals');

      const allProducts = await productsCol.find({}).toArray();
      const allOrders = await ordersCol.find({}).toArray();
      const pendingApprovalsCount = await approvalsCol.countDocuments({ status: 'PENDING' });

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
        pendingApprovalsCount,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockAlerts: [...outOfStockProducts, ...lowStockProducts].slice(0, 10),
        recentProducts,
        recentOrders,
        database: getDatabaseStatus()
      });
    }

    // 3. Health & Database diagnostic endpoint
    if (path === 'health' || path === 'system/status') {
      const dbStatus = getDatabaseStatus();
      return successResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        database: dbStatus
      });
    }

    // 4. Employees & Team Management (Owner & Superadmin only)
    if (path === 'employees') {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only store owners can view or manage team members', 403);
      }

      const adminsCol = await getCollection('admins');
      const employees = await adminsCol.find({}).toArray();

      // Mask password hashes
      const safeEmployees = employees.map(emp => {
        const { password, ...safe } = emp;
        return safe;
      });

      return successResponse({
        employees: safeEmployees,
        availableRoles: [ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE],
        availablePermissions: ALL_PERMISSIONS
      });
    }

    // 5. Approvals List (Owner & Superadmin can review all, Employees can view their own requests)
    if (path === 'approvals') {
      const approvalsCol = await getCollection('approvals');
      const status = searchParams.get('status'); // 'PENDING', 'APPROVED', 'REJECTED'

      let query = {};
      if (status) {
        query.status = status.toUpperCase();
      }

      // If user is employee, restrict to approvals requested by them
      const isOwner = auth.user.role === ROLES.OWNER || auth.user.role === 'superadmin';
      if (!isOwner) {
        query['requestedBy.id'] = auth.user.id;
      }

      const approvals = await approvalsCol.find(query).sort({ createdAt: -1 }).toArray();

      return successResponse({
        approvals,
        total: approvals.length,
        pendingCount: approvals.filter(a => a.status === 'PENDING').length
      });
    }

    // Single approval detail
    if (path.startsWith('approvals/') && path.split('/').length === 2) {
      const id = path.split('/')[1];
      const approvalsCol = await getCollection('approvals');
      const approval = await approvalsCol.findOne({ _id: id });

      if (!approval) {
        return errorResponse('Approval request not found', 404);
      }

      const isOwner = auth.user.role === ROLES.OWNER || auth.user.role === 'superadmin';
      if (!isOwner && approval.requestedBy?.id !== auth.user.id) {
        return errorResponse('Forbidden', 403);
      }

      return successResponse({ approval });
    }

    // 6. Audit Logs (Owner, Superadmin, and Manager only)
    if (path === 'audit-logs' || path === 'audit') {
      const auditPerm = await requirePermission(request, 'audit:read');
      if (!auditPerm.authorized) {
        return errorResponse('Forbidden: You do not have permission to view audit logs', 403);
      }

      const auditCol = await getCollection('audit_logs');
      const action = searchParams.get('action');
      const targetType = searchParams.get('targetType');
      const limit = parseInt(searchParams.get('limit')) || 100;

      const query = {};
      if (action) query.action = action;
      if (targetType) query.targetType = targetType;

      const logs = await auditCol.find(query).sort({ timestamp: -1 }).limit(limit).toArray();

      return successResponse({
        logs,
        total: logs.length
      });
    }

    // 7. Get single product: /api/admin/products/:id
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

    // 8. Get all products with search, filtering and pagination
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

    // 9. Get all categories
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

    // 10. Get single category: /api/admin/categories/:id
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

    // 11. Orders endpoints
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

    // 12. Settings endpoint
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

// =========================================================================
// POST handler for admin endpoints
// =========================================================================
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

      // Auto-seed siraj@mainadmin or burhan@store if not present
      if (!admin && (cleanEmail === 'siraj@mainadmin' || cleanEmail === 'burhan@store' || cleanEmail === 'admin@burhan.com')) {
        const passwordHash = process.env.ADMIN_INITIAL_PASSWORD
          ? await hashPassword(process.env.ADMIN_INITIAL_PASSWORD)
          : '$2a$10$i5EEGpbK71v11OWUrbUvReoj/ICRfnYaT59KfMskeTcWX/5qLV7ES';

        const newAdmin = {
          _id: cleanEmail === 'siraj@mainadmin' ? 'admin-owner-siraj' : (cleanEmail === 'burhan@store' ? 'admin-burhan-owner' : 'admin-superadmin'),
          name: cleanEmail === 'siraj@mainadmin' ? 'Siraj Ahmed (Store Owner)' : (cleanEmail === 'burhan@store' ? 'Burhan Store Owner' : 'Super Admin'),
          email: cleanEmail,
          password: passwordHash,
          role: ROLES.OWNER,
          status: 'active',
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await adminsCol.insertOne(newAdmin);
        admin = newAdmin;
      }

      if (!admin) {
        recordFailedAttempt(cleanEmail);
        return errorResponse('Invalid credentials', 401);
      }

      if (admin.status === 'suspended' || admin.status === 'inactive') {
        return errorResponse('Account is deactivated. Contact the Store Owner.', 403);
      }

      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        recordFailedAttempt(cleanEmail);
        return errorResponse('Invalid credentials', 401);
      }

      // Password is correct - clear failed attempts
      clearRateLimit(cleanEmail);

      const assignedRole = (admin.role === 'superadmin' || admin.role === 'owner') ? ROLES.OWNER : (admin.role || ROLES.EMPLOYEE);

      const token = await createToken({
        id: admin._id,
        email: admin.email,
        name: admin.name || 'Admin',
        role: assignedRole,
        permissions: admin.permissions || []
      });

      // Log successful login audit
      await logAuditEvent({
        action: 'ADMIN_LOGIN',
        actor: { id: admin._id, email: admin.email, name: admin.name, role: assignedRole },
        targetType: 'employee',
        targetId: admin._id,
        targetName: admin.name,
        details: { email: admin.email, role: assignedRole }
      });

      const response = successResponse({
        success: true,
        token,
        user: {
          id: admin._id,
          email: admin.email,
          name: admin.name || 'Admin',
          role: assignedRole,
          permissions: admin.permissions || []
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

    // 3. Employee Creation (Owner & Superadmin only)
    if (path === 'employees') {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only the store owner can create employee accounts', 403);
      }

      const body = await request.json();
      const { name, email, password, role = ROLES.EMPLOYEE, permissions } = body;

      if (!name || !email || !password) {
        return errorResponse('Name, email, and password are required', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      const adminsCol = await getCollection('admins');

      const existing = await adminsCol.findOne({ email: cleanEmail });
      if (existing) {
        return errorResponse('An account with this email already exists', 400);
      }

      const hashedPassword = await hashPassword(password);
      const newAdmin = {
        _id: uuidv4(),
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: [ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE].includes(role) ? role : ROLES.EMPLOYEE,
        status: 'active',
        permissions: Array.isArray(permissions) ? permissions : (ROLE_DEFAULT_PERMISSIONS[role] || []),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: auth.user.email
      };

      await adminsCol.insertOne(newAdmin);

      await logAuditEvent({
        action: 'EMPLOYEE_CREATED',
        actor: auth.user,
        targetType: 'employee',
        targetId: newAdmin._id,
        targetName: newAdmin.name,
        details: { email: newAdmin.email, role: newAdmin.role }
      });

      const { password: _, ...safeEmployee } = newAdmin;
      return successResponse({ success: true, employee: safeEmployee }, 201);
    }

    // 4. Approval Decision (Approve / Reject by Owner)
    if (path.startsWith('approvals/') && (path.endsWith('/approve') || path.endsWith('/reject'))) {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only the store owner can approve or reject change requests', 403);
      }

      const parts = path.split('/');
      const approvalId = parts[1];
      const isApprove = path.endsWith('/approve');
      const body = await request.json().catch(() => ({}));
      const reviewNote = body.reviewNote || (isApprove ? 'Approved by Owner' : 'Rejected by Owner');

      const approvalsCol = await getCollection('approvals');
      const approval = await approvalsCol.findOne({ _id: approvalId });

      if (!approval) {
        return errorResponse('Approval request not found', 404);
      }

      if (approval.status !== 'PENDING') {
        return errorResponse(`Request is already resolved (${approval.status})`, 400);
      }

      const now = new Date().toISOString();

      if (!isApprove) {
        // REJECT ACTION
        await approvalsCol.updateOne(
          { _id: approvalId },
          {
            $set: {
              status: 'REJECTED',
              reviewedBy: {
                id: auth.user.id,
                email: auth.user.email,
                name: auth.user.name
              },
              reviewNote,
              reviewedAt: now,
              updatedAt: now
            }
          }
        );

        await logAuditEvent({
          action: 'APPROVAL_REJECTED',
          actor: auth.user,
          targetType: 'approval',
          targetId: approvalId,
          targetName: approval.actionType,
          status: 'REJECTED',
          details: {
            actionType: approval.actionType,
            targetId: approval.targetId,
            requestedBy: approval.requestedBy,
            reviewNote
          }
        });

        return successResponse({ success: true, message: 'Change request rejected', status: 'REJECTED' });
      }

      // APPROVE ACTION - COMMIT THE CHANGE TO REAL TARGET COLLECTION
      const { actionType, targetCollection, targetId, proposedChanges } = approval;

      if (actionType === 'PRODUCT_PRICE_CHANGE' || actionType === 'PRODUCT_STOCK_CHANGE' || actionType === 'PRODUCT_UPDATE') {
        const productsCol = await getCollection('products');
        const updateSet = {
          ...proposedChanges,
          updatedAt: now
        };
        await productsCol.updateOne(buildIdQuery(targetId), { $set: updateSet });
      } else if (actionType === 'PRODUCT_DELETE') {
        const productsCol = await getCollection('products');
        const categoriesCol = await getCollection('categories');
        const product = await productsCol.findOne(buildIdQuery(targetId));
        if (product) {
          await productsCol.deleteOne({ _id: product._id });
          if (product.category) {
            await categoriesCol.updateOne(
              { name: product.category },
              { $inc: { productCount: -1 } }
            );
          }
        }
      } else if (actionType === 'CATEGORY_DELETE') {
        const categoriesCol = await getCollection('categories');
        await categoriesCol.deleteOne(buildIdQuery(targetId));
      } else if (actionType === 'ORDER_DELETE') {
        const ordersCol = await getCollection('orders');
        await ordersCol.deleteOne(buildIdQuery(targetId));
      }

      // Mark approval as APPROVED
      await approvalsCol.updateOne(
        { _id: approvalId },
        {
          $set: {
            status: 'APPROVED',
            reviewedBy: {
              id: auth.user.id,
              email: auth.user.email,
              name: auth.user.name
            },
            reviewNote,
            reviewedAt: now,
            updatedAt: now
          }
        }
      );

      await logAuditEvent({
        action: 'APPROVAL_APPROVED_AND_COMMITTED',
        actor: auth.user,
        targetType: targetCollection || 'approval',
        targetId: targetId || approvalId,
        targetName: approval.targetName || approval.actionType,
        status: 'APPROVED',
        details: {
          actionType,
          proposedChanges,
          requestedBy: approval.requestedBy,
          reviewNote
        }
      });

      return successResponse({
        success: true,
        message: 'Change approved and successfully applied to database',
        status: 'APPROVED'
      });
    }

    // 5. Create Product Endpoint
    if (path === 'products') {
      const permCheck = await requirePermission(request, 'products:create');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to create products', 403);
      }

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
        status: body.status || 'active',
        isActive: body.status ? body.status === 'active' : (body.isActive !== false),
        isFeatured: Boolean(body.isFeatured),
        isTrending: Boolean(body.isTrending),
        isNew: body.isNew !== undefined ? Boolean(body.isNew) : true,
        rating: 5,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: auth.user.email
      };

      await productsCol.insertOne(newProduct);

      // Increment category productCount
      await categoriesCol.updateOne(
        { name: newProduct.category },
        { $inc: { productCount: 1 } }
      );

      await logAuditEvent({
        action: 'PRODUCT_CREATED',
        actor: auth.user,
        targetType: 'product',
        targetId: newProduct._id,
        targetName: newProduct.name,
        details: { price: newProduct.price, stock: newProduct.stock, category: newProduct.category }
      });

      return successResponse({ success: true, product: newProduct }, 201);
    }

    // 6. Create Category Endpoint
    if (path === 'categories') {
      const permCheck = await requirePermission(request, 'categories:create');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to create categories', 403);
      }

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await categoriesCol.insertOne(newCategory);

      await logAuditEvent({
        action: 'CATEGORY_CREATED',
        actor: auth.user,
        targetType: 'category',
        targetId: newCategory._id,
        targetName: newCategory.name,
        details: { name: newCategory.name, slug: newCategory.slug }
      });

      return successResponse({ success: true, category: newCategory }, 201);
    }

    // 7. Update Order Status
    if (path.startsWith('orders/') && path.endsWith('/status')) {
      const permCheck = await requirePermission(request, 'orders:update_status');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to update orders', 403);
      }

      const orderId = path.split('/')[1];
      const { status, message } = await request.json();

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne(buildIdQuery(orderId));

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = Array.isArray(order.timeline) ? order.timeline : [];
      timeline.push({
        status,
        timestamp: new Date().toISOString(),
        message: message || `Status updated to ${status} by ${auth.user.name} (${auth.user.role})`
      });

      await ordersCol.updateOne(
        { _id: order._id },
        { $set: { status, timeline, updatedAt: new Date().toISOString() } }
      );

      await logAuditEvent({
        action: 'ORDER_STATUS_UPDATED',
        actor: auth.user,
        targetType: 'order',
        targetId: order._id,
        targetName: `Order #${String(order._id).slice(0, 8)}`,
        details: { previousStatus: order.status, newStatus: status, message }
      });

      return successResponse({ success: true, message: 'Order status updated' });
    }

    // 8. Save Settings (Owner & Superadmin only)
    if (path === 'settings') {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only store owners can update settings', 403);
      }

      const body = await request.json();
      const settingsCol = await getCollection('settings');

      await settingsCol.updateOne(
        { type: 'general' },
        { $set: { ...body, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );

      await logAuditEvent({
        action: 'SETTINGS_UPDATED',
        actor: auth.user,
        targetType: 'settings',
        targetId: 'general',
        targetName: 'Store Settings',
        details: body
      });

      return successResponse({ success: true, message: 'Settings saved successfully' });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// =========================================================================
// PUT handler for full updates
// =========================================================================
export async function PUT(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // 1. Employee Update (Owner only)
    if (path.startsWith('employees/')) {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only the store owner can edit employee accounts', 403);
      }

      const id = path.split('/')[1];
      const body = await request.json();
      const adminsCol = await getCollection('admins');

      const existing = await adminsCol.findOne(buildIdQuery(id));
      if (!existing) {
        return errorResponse('Employee account not found', 404);
      }

      // Do not allow demoting primary owner account if self
      if (existing._id === 'admin-owner-siraj' && body.role && body.role !== ROLES.OWNER) {
        return errorResponse('Cannot demote the primary store owner account', 400);
      }

      const updateData = { updatedAt: new Date().toISOString() };
      if (body.name) updateData.name = body.name.trim();
      if (body.role) updateData.role = body.role;
      if (body.status) updateData.status = body.status;
      if (Array.isArray(body.permissions)) updateData.permissions = body.permissions;
      if (body.password) {
        updateData.password = await hashPassword(body.password);
      }

      await adminsCol.updateOne({ _id: existing._id }, { $set: updateData });

      await logAuditEvent({
        action: 'EMPLOYEE_UPDATED',
        actor: auth.user,
        targetType: 'employee',
        targetId: existing._id,
        targetName: updateData.name || existing.name,
        details: { changes: updateData }
      });

      const updated = await adminsCol.findOne({ _id: existing._id });
      const { password: _, ...safeUser } = updated;
      return successResponse({ success: true, employee: safeUser });
    }

    // 2. Update order status via PUT
    if (path.startsWith('orders/') && (path.endsWith('/status') || path.split('/').length === 2)) {
      const permCheck = await requirePermission(request, 'orders:update_status');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to update orders', 403);
      }

      const orderId = path.split('/')[1];
      const body = await request.json();
      const status = body.status;
      const message = body.message;

      if (!status) {
        return errorResponse('Status is required', 400);
      }

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne(buildIdQuery(orderId));
      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
      timeline.push({
        status,
        timestamp: new Date().toISOString(),
        message: message || `Status updated to ${status} by ${auth.user.name}`
      });

      await ordersCol.updateOne(
        { _id: order._id },
        { $set: { status, timeline, updatedAt: new Date().toISOString() } }
      );

      await logAuditEvent({
        action: 'ORDER_STATUS_UPDATED',
        actor: auth.user,
        targetType: 'order',
        targetId: order._id,
        targetName: `Order #${String(order._id).slice(0, 8)}`,
        details: { previousStatus: order.status, newStatus: status, message }
      });

      const updated = await ordersCol.findOne({ _id: order._id });
      return successResponse({ success: true, message: 'Order status updated', order: updated });
    }

    // 3. Update product (Full edit)
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      const productsCol = await getCollection('products');
      const categoriesCol = await getCollection('categories');

      const existing = await productsCol.findOne(buildIdQuery(id));
      if (!existing) {
        return errorResponse('Product not found in database', 404);
      }

      // Check if price or stock is being modified and whether approval is required
      const isPriceChanged = body.price !== undefined && parseFloat(body.price) !== existing.price;
      const isStockChanged = body.stock !== undefined && parseInt(body.stock, 10) !== existing.stock;

      const requiresPriceApproval = isPriceChanged && doesActionRequireApproval(auth.user.role, 'PRODUCT_PRICE_CHANGE');
      const requiresStockApproval = isStockChanged && doesActionRequireApproval(auth.user.role, 'PRODUCT_STOCK_CHANGE');

      if (requiresPriceApproval || requiresStockApproval) {
        // Intercept and create an Approval Request
        const approvalsCol = await getCollection('approvals');
        const proposedChanges = {};
        if (isPriceChanged) proposedChanges.price = parseFloat(body.price);
        if (body.oldPrice !== undefined) proposedChanges.oldPrice = parseFloat(body.oldPrice);
        if (isStockChanged) proposedChanges.stock = parseInt(body.stock, 10);

        const approvalRequest = {
          _id: uuidv4(),
          actionType: isPriceChanged && isStockChanged ? 'PRODUCT_UPDATE' : (isPriceChanged ? 'PRODUCT_PRICE_CHANGE' : 'PRODUCT_STOCK_CHANGE'),
          targetCollection: 'products',
          targetId: existing._id,
          targetName: existing.name,
          currentData: {
            price: existing.price,
            oldPrice: existing.oldPrice,
            stock: existing.stock
          },
          proposedChanges,
          status: 'PENDING',
          requestedBy: {
            id: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
            role: auth.user.role
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await approvalsCol.insertOne(approvalRequest);

        await logAuditEvent({
          action: 'APPROVAL_REQUEST_SUBMITTED',
          actor: auth.user,
          targetType: 'product',
          targetId: existing._id,
          targetName: existing.name,
          status: 'PENDING_APPROVAL',
          details: {
            approvalId: approvalRequest._id,
            actionType: approvalRequest.actionType,
            proposedChanges
          }
        });

        return successResponse({
          success: true,
          approvalRequired: true,
          message: 'Change submitted for Store Owner approval. Once approved, the changes will take effect.',
          approval: approvalRequest
        }, 202);
      }

      // If no approval required (e.g. Owner or non-critical details)
      const price = body.price !== undefined ? parseFloat(body.price) : existing.price;
      const oldPrice = body.oldPrice !== undefined ? (body.oldPrice ? parseFloat(body.oldPrice) : null) : existing.oldPrice;
      const discount = oldPrice && oldPrice > price
        ? Math.round(((oldPrice - price) / oldPrice) * 100)
        : (body.discount !== undefined ? parseFloat(body.discount) : existing.discount || 0);

      const images = Array.isArray(body.images) ? body.images : (body.image ? [body.image] : existing.images);
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
        updatedAt: new Date().toISOString()
      };
      delete updateData._id;

      await productsCol.updateOne({ _id: existing._id }, { $set: updateData });

      // Update category product counts if category changed
      if (body.category && body.category !== existing.category) {
        if (existing.category) {
          await categoriesCol.updateOne({ name: existing.category }, { $inc: { productCount: -1 } });
        }
        await categoriesCol.updateOne({ name: body.category }, { $inc: { productCount: 1 } });
      }

      await logAuditEvent({
        action: 'PRODUCT_UPDATED',
        actor: auth.user,
        targetType: 'product',
        targetId: existing._id,
        targetName: existing.name,
        details: {
          previous: { price: existing.price, stock: existing.stock },
          updated: { price, stock, category: body.category }
        }
      });

      const updatedProduct = await productsCol.findOne({ _id: existing._id });
      return successResponse({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
      });
    }

    // 4. Update category
    if (path.startsWith('categories/')) {
      const permCheck = await requirePermission(request, 'categories:edit');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to edit categories', 403);
      }

      const id = path.split('/')[1];
      const body = await request.json();
      const categoriesCol = await getCollection('categories');

      const existing = await categoriesCol.findOne(buildIdQuery(id));
      if (!existing) {
        return errorResponse('Category not found', 404);
      }

      const updateData = {
        ...body,
        updatedAt: new Date().toISOString()
      };
      delete updateData._id;

      await categoriesCol.updateOne({ _id: existing._id }, { $set: updateData });

      await logAuditEvent({
        action: 'CATEGORY_UPDATED',
        actor: auth.user,
        targetType: 'category',
        targetId: existing._id,
        targetName: existing.name,
        details: updateData
      });

      const updatedCategory = await categoriesCol.findOne({ _id: existing._id });
      return successResponse({
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}

// =========================================================================
// PATCH handler for quick updates (price, stock, status toggle)
// =========================================================================
export async function PATCH(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // 1. Support order status update via PATCH
    if (path.startsWith('orders/') && path.endsWith('/status')) {
      const permCheck = await requirePermission(request, 'orders:update_status');
      if (!permCheck.authorized) {
        return errorResponse('Forbidden: You do not have permission to update orders', 403);
      }

      const orderId = path.split('/')[1];
      const { status, message } = await request.json();

      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne(buildIdQuery(orderId));
      if (!order) {
        return errorResponse('Order not found', 404);
      }

      const timeline = Array.isArray(order.timeline) ? [...order.timeline] : [];
      timeline.push({
        status,
        timestamp: new Date().toISOString(),
        message: message || `Status updated to ${status} by ${auth.user.name}`
      });

      await ordersCol.updateOne(
        { _id: order._id },
        { $set: { status, timeline, updatedAt: new Date().toISOString() } }
      );

      await logAuditEvent({
        action: 'ORDER_STATUS_UPDATED',
        actor: auth.user,
        targetType: 'order',
        targetId: order._id,
        targetName: `Order #${String(order._id).slice(0, 8)}`,
        details: { previousStatus: order.status, newStatus: status, message }
      });

      const updated = await ordersCol.findOne({ _id: order._id });
      return successResponse({ success: true, message: 'Order status updated', order: updated });
    }

    // 2. Quick product update (price, stock, status toggle)
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const body = await request.json();
      const productsCol = await getCollection('products');

      const existing = await productsCol.findOne(buildIdQuery(id));
      if (!existing) {
        return errorResponse('Product not found in database', 404);
      }

      const isPriceChanged = body.price !== undefined && parseFloat(body.price) !== existing.price;
      const isStockChanged = body.stock !== undefined && parseInt(body.stock, 10) !== existing.stock;

      // Check if this action requires Owner Approval
      const requiresPriceApproval = isPriceChanged && doesActionRequireApproval(auth.user.role, 'PRODUCT_PRICE_CHANGE');
      const requiresStockApproval = isStockChanged && doesActionRequireApproval(auth.user.role, 'PRODUCT_STOCK_CHANGE');

      if (requiresPriceApproval || requiresStockApproval) {
        const approvalsCol = await getCollection('approvals');
        const proposedChanges = {};

        if (isPriceChanged) {
          proposedChanges.price = parseFloat(body.price);
          if (body.oldPrice !== undefined) proposedChanges.oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
          if (proposedChanges.oldPrice && proposedChanges.oldPrice > proposedChanges.price) {
            proposedChanges.discount = Math.round(((proposedChanges.oldPrice - proposedChanges.price) / proposedChanges.oldPrice) * 100);
          }
        }

        if (isStockChanged) {
          proposedChanges.stock = Math.max(0, parseInt(body.stock, 10));
        }

        const actionType = isPriceChanged && isStockChanged
          ? 'PRODUCT_UPDATE'
          : (isPriceChanged ? 'PRODUCT_PRICE_CHANGE' : 'PRODUCT_STOCK_CHANGE');

        const approvalRequest = {
          _id: uuidv4(),
          actionType,
          targetCollection: 'products',
          targetId: existing._id,
          targetName: existing.name,
          currentData: {
            price: existing.price,
            oldPrice: existing.oldPrice,
            stock: existing.stock
          },
          proposedChanges,
          status: 'PENDING',
          requestedBy: {
            id: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
            role: auth.user.role
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await approvalsCol.insertOne(approvalRequest);

        await logAuditEvent({
          action: 'APPROVAL_REQUEST_SUBMITTED',
          actor: auth.user,
          targetType: 'product',
          targetId: existing._id,
          targetName: existing.name,
          status: 'PENDING_APPROVAL',
          details: {
            approvalId: approvalRequest._id,
            actionType,
            proposedChanges
          }
        });

        return successResponse({
          success: true,
          approvalRequired: true,
          message: 'Change submitted to Store Owner for approval. It will become live as soon as the Owner confirms it.',
          approval: approvalRequest
        }, 202);
      }

      // No approval required: Direct commit (Owner or manager permitted)
      const updateSet = { updatedAt: new Date().toISOString() };

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

      if (body.isActive !== undefined) {
        updateSet.isActive = Boolean(body.isActive);
        updateSet.status = updateSet.isActive ? 'active' : 'inactive';
      }

      if (body.isFeatured !== undefined) updateSet.isFeatured = Boolean(body.isFeatured);
      if (body.isTrending !== undefined) updateSet.isTrending = Boolean(body.isTrending);
      if (body.isNew !== undefined) updateSet.isNew = Boolean(body.isNew);

      await productsCol.updateOne({ _id: existing._id }, { $set: updateSet });

      await logAuditEvent({
        action: 'PRODUCT_QUICK_UPDATED',
        actor: auth.user,
        targetType: 'product',
        targetId: existing._id,
        targetName: existing.name,
        details: { previous: { price: existing.price, stock: existing.stock }, updated: updateSet }
      });

      const updatedProduct = await productsCol.findOne({ _id: existing._id });
      return successResponse({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct,
        updated: updateSet
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin PATCH Error:', error);
    return errorResponse(error.message);
  }
}

// =========================================================================
// DELETE handler
// =========================================================================
export async function DELETE(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');

  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return errorResponse('Unauthorized', 401);
    }

    // 1. Employee Deletion (Owner only)
    if (path.startsWith('employees/')) {
      const ownerCheck = await requireOwner(request);
      if (!ownerCheck.authorized) {
        return errorResponse('Forbidden: Only the store owner can delete employee accounts', 403);
      }

      const id = path.split('/')[1];
      const adminsCol = await getCollection('admins');

      const employee = await adminsCol.findOne(buildIdQuery(id));
      if (!employee) {
        return errorResponse('Employee not found', 404);
      }

      if (employee._id === 'admin-owner-siraj' || employee.email === 'siraj@mainadmin') {
        return errorResponse('Cannot delete the primary store owner account', 400);
      }

      if (employee._id === auth.user.id) {
        return errorResponse('You cannot delete your own account', 400);
      }

      await adminsCol.deleteOne({ _id: employee._id });

      await logAuditEvent({
        action: 'EMPLOYEE_DELETED',
        actor: auth.user,
        targetType: 'employee',
        targetId: employee._id,
        targetName: employee.name,
        details: { email: employee.email, role: employee.role }
      });

      return successResponse({
        success: true,
        message: 'Employee account permanently deleted',
        deletedId: employee._id
      });
    }

    // 2. Delete product
    if (path.startsWith('products/')) {
      const id = path.split('/')[1];
      const productsCol = await getCollection('products');
      const categoriesCol = await getCollection('categories');

      const product = await productsCol.findOne(buildIdQuery(id));
      if (!product) {
        return errorResponse('Product not found in database', 404);
      }

      // Check if employee or manager deletion requires Owner Approval
      if (doesActionRequireApproval(auth.user.role, 'PRODUCT_DELETE')) {
        const approvalsCol = await getCollection('approvals');
        const approvalRequest = {
          _id: uuidv4(),
          actionType: 'PRODUCT_DELETE',
          targetCollection: 'products',
          targetId: product._id,
          targetName: product.name,
          currentData: {
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category
          },
          proposedChanges: { action: 'PERMANENT_DELETION' },
          status: 'PENDING',
          requestedBy: {
            id: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
            role: auth.user.role
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await approvalsCol.insertOne(approvalRequest);

        await logAuditEvent({
          action: 'APPROVAL_REQUEST_SUBMITTED',
          actor: auth.user,
          targetType: 'product',
          targetId: product._id,
          targetName: product.name,
          status: 'PENDING_APPROVAL',
          details: { approvalId: approvalRequest._id, actionType: 'PRODUCT_DELETE' }
        });

        return successResponse({
          success: true,
          approvalRequired: true,
          message: 'Product deletion request sent to Store Owner for approval. The product will remain until approved.',
          approval: approvalRequest
        }, 202);
      }

      // Direct Owner deletion
      await productsCol.deleteOne({ _id: product._id });

      if (product.category) {
        await categoriesCol.updateOne(
          { name: product.category },
          { $inc: { productCount: -1 } }
        );
      }

      await logAuditEvent({
        action: 'PRODUCT_DELETED',
        actor: auth.user,
        targetType: 'product',
        targetId: product._id,
        targetName: product.name,
        details: { category: product.category, price: product.price }
      });

      return successResponse({
        success: true,
        message: 'Product permanently deleted',
        deletedId: product._id
      });
    }

    // 3. Delete category
    if (path.startsWith('categories/')) {
      const id = path.split('/')[1];
      const categoriesCol = await getCollection('categories');

      const category = await categoriesCol.findOne(buildIdQuery(id));
      if (!category) {
        return errorResponse('Category not found', 404);
      }

      if (doesActionRequireApproval(auth.user.role, 'CATEGORY_DELETE')) {
        const approvalsCol = await getCollection('approvals');
        const approvalRequest = {
          _id: uuidv4(),
          actionType: 'CATEGORY_DELETE',
          targetCollection: 'categories',
          targetId: category._id,
          targetName: category.name,
          currentData: { name: category.name },
          proposedChanges: { action: 'PERMANENT_DELETION' },
          status: 'PENDING',
          requestedBy: {
            id: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
            role: auth.user.role
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await approvalsCol.insertOne(approvalRequest);

        return successResponse({
          success: true,
          approvalRequired: true,
          message: 'Category deletion submitted to Store Owner for approval.',
          approval: approvalRequest
        }, 202);
      }

      await categoriesCol.deleteOne({ _id: category._id });

      await logAuditEvent({
        action: 'CATEGORY_DELETED',
        actor: auth.user,
        targetType: 'category',
        targetId: category._id,
        targetName: category.name,
        details: { name: category.name }
      });

      return successResponse({
        success: true,
        message: 'Category deleted successfully',
        deletedId: category._id
      });
    }

    // 4. Delete order
    if (path.startsWith('orders/')) {
      const id = path.split('/')[1];
      const ordersCol = await getCollection('orders');

      const order = await ordersCol.findOne(buildIdQuery(id));
      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (doesActionRequireApproval(auth.user.role, 'ORDER_DELETE')) {
        const approvalsCol = await getCollection('approvals');
        const approvalRequest = {
          _id: uuidv4(),
          actionType: 'ORDER_DELETE',
          targetCollection: 'orders',
          targetId: order._id,
          targetName: `Order #${String(order._id).slice(0, 8)}`,
          currentData: { total: order.total, customer: order.customer },
          proposedChanges: { action: 'PERMANENT_DELETION' },
          status: 'PENDING',
          requestedBy: {
            id: auth.user.id,
            email: auth.user.email,
            name: auth.user.name,
            role: auth.user.role
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await approvalsCol.insertOne(approvalRequest);

        return successResponse({
          success: true,
          approvalRequired: true,
          message: 'Order deletion submitted to Store Owner for approval.',
          approval: approvalRequest
        }, 202);
      }

      await ordersCol.deleteOne({ _id: order._id });

      await logAuditEvent({
        action: 'ORDER_DELETED',
        actor: auth.user,
        targetType: 'order',
        targetId: order._id,
        targetName: `Order #${String(order._id).slice(0, 8)}`,
        details: { total: order.total, customer: order.customer?.name }
      });

      return successResponse({
        success: true,
        message: 'Order permanently deleted',
        deletedId: order._id
      });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Admin API Error:', error);
    return errorResponse(error.message);
  }
}
