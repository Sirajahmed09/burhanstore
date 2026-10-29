import { resolveColourSelection, cartLineKey } from '@/lib/commerce/colourVariants';
import { verifyHumanCheck } from '@/lib/security/human-check';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readJsonBody, clientAddress, literalSearch } from '@/lib/security/requests';
import { consumeRateLimit, validateOrderLimits } from '@/lib/security/rate-limit';
import { publicProduct } from '@/lib/commerce/publicProduct';
import { NextResponse } from 'next/server';
import { connectToDatabase, getCollection, getDatabaseStatus, buildIdQuery } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { notifyOrderCustomer } from '@/lib/notifications/orderNotifications';
import { resolveShippingFee } from '@/lib/commerce/shipping';
import { normalizePakistaniPhone } from '@/lib/utils/phone';
import { areOrdersPayloadCompatible } from '@/lib/orders/idempotency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Revalidation helper to keep public storefront synchronized immediately with real DB state
export function revalidateStorefront(slug = '', category = '') {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/shop/[slug]', 'page');
    if (slug) revalidatePath(`/shop/${slug}`);
    revalidatePath('/category/[slug]', 'page');
    if (category) {
      const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      revalidatePath(`/category/${catSlug}`);
    }
    revalidatePath('/sitemap.xml');
  } catch (err) {
    console.warn('[Storefront Revalidation] Notice:', err.message);
  }
}

// Helper function to handle errors
function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status, headers: NO_CACHE_HEADERS });
}

// Active product visibility filter: strictly excludes inactive, hidden, or draft products
const ACTIVE_PRODUCT_FILTER = {
  status: { $nin: ['inactive', 'hidden', 'draft'] },
  isActive: { $ne: false },
  visible: { $ne: false }
};

function isProductActive(product) {
  if (!product) return false;
  if (product.status === 'inactive' || product.status === 'hidden' || product.status === 'draft') return false;
  if (product.isActive === false) return false;
  if (product.visible === false) return false;
  return true;
}

// Safely sanitize product data to never expose costPrice, internal margins, or admin notes
function sanitizePublicProduct(product) {
  if (!product) return null;
  return publicProduct(product);
}

function sanitizeTrackedOrder(order) {
  if (!order) return null;
  return {
    _id: order._id,
    orderNumber: order.orderNumber || order._id,
    status: order.status || 'pending',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: Array.isArray(order.items) ? order.items.map(({ productId, name, price, quantity, image, variantId, color }) => ({ productId, name, price, quantity, image, variantId, color })) : [],
    subtotal: order.subtotal || order.pricing?.subtotal || 0,
    shipping: order.shipping ?? order.pricing?.shipping ?? 0,
    total: order.total || order.pricing?.total || 0,
    paymentMethod: order.paymentMethod || 'cod',
    timeline: Array.isArray(order.timeline) ? order.timeline.map(({ status, timestamp }) => ({ status, timestamp, message: ({ pending: 'Order received', confirmed: 'Order confirmed', processing: 'Preparing your order', shipped: 'Handed to courier', delivered: 'Delivered', cancelled: 'Order cancelled', returned: 'Returned', refunded: 'Refund processed' })[status] || 'Order status updated' })) : [],
    shipment: order.shipment ? {
      courier: order.shipment.courier,
      trackingNumber: order.shipment.trackingNumber,
      trackingUrl: order.shipment.trackingUrl,
      bookedAt: order.shipment.bookedAt,
    } : null,
    customer: {
      name: order.customer?.name || '',
      city: order.customer?.city || '',
    },
  };
}

// Helper function to create slug from name
function createSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET handler
export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  try {
    // Root endpoint
    if (path === '' || path === 'api') {
      return NextResponse.json({ message: 'Burhan eCommerce API v1.0' }, { headers: NO_CACHE_HEADERS });
    }

    // Health check endpoint
    if (path === 'health') {
      try {
        // A status-only read can report "healthy" before a MongoDB connection
        // has ever been attempted. Probe the real connection so deployment
        // diagnostics reflect the same failure the catalogue would encounter.
        await connectToDatabase();
      } catch (dbError) {
        const dbStatus = getDatabaseStatus();
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: {
            configured: dbStatus.isConfigured,
            connected: false,
            provider: dbStatus.provider,
          },
          error: 'Database unavailable',
        }, { status: 503, headers: NO_CACHE_HEADERS });
      }

      const dbStatus = getDatabaseStatus();
      const healthy = dbStatus.isConnected;
      return NextResponse.json({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          configured: dbStatus.isConfigured,
          connected: dbStatus.isConnected,
          provider: dbStatus.provider,
        }
      }, { status: healthy ? 200 : 503, headers: NO_CACHE_HEADERS });
    }

    // Products endpoints
    if (path === 'products') {
      const productsCol = await getCollection('products');
      
      // Get query parameters
      const category = searchParams.get('category');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const sort = searchParams.get('sort') || 'newest';
      const search = literalSearch(searchParams.get('search'));
      const inStock = searchParams.get('inStock');
      const rating = searchParams.get('rating');

      // Build filter
      const filter = {
        ...ACTIVE_PRODUCT_FILTER
      };
      if (category) filter.category = category;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      if (inStock === 'true') filter.stock = { $gt: 0 };
      if (rating) filter.rating = { $gte: parseFloat(rating) };

      // Build sort
      let sortOption = {};
      switch (sort) {
        case 'price-low':
          sortOption = { price: 1 };
          break;
        case 'price-high':
          sortOption = { price: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1, reviewCount: -1 };
          break;
        case 'popular':
          sortOption = { reviewCount: -1, rating: -1 };
          break;
        case 'name':
          sortOption = { name: 1 };
          break;
        case 'newest':
        default:
          sortOption = { createdAt: -1 };
      }

      // Add pagination
      const page = Math.min(100, Math.max(1, parseInt(searchParams.get('page'), 10) || 1));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 100));
      const skip = (page - 1) * limit;

      const products = await productsCol.find(filter).sort(sortOption).skip(skip).limit(limit).toArray();
      const total = await productsCol.countDocuments(filter);
      
      return NextResponse.json({ 
        products: products.map(sanitizePublicProduct), 
        count: products.length,
        total,
        page,
        pages: Math.ceil(total / limit)
      }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'products/featured') {
      const productsCol = await getCollection('products');
      const products = await productsCol
        .find({ ...ACTIVE_PRODUCT_FILTER, isFeatured: true })
        .limit(8)
        .toArray();
      return NextResponse.json({ products: products.map(sanitizePublicProduct) }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'products/trending') {
      const productsCol = await getCollection('products');
      const products = await productsCol
        .find({ ...ACTIVE_PRODUCT_FILTER, isTrending: true })
        .limit(8)
        .toArray();
      return NextResponse.json({ products: products.map(sanitizePublicProduct) }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'products/best-sellers') {
      const productsCol = await getCollection('products');
      const products = await productsCol
        .find({ ...ACTIVE_PRODUCT_FILTER })
        .sort({ reviewCount: -1, rating: -1 })
        .limit(8)
        .toArray();
      return NextResponse.json({ products: products.map(sanitizePublicProduct) }, { headers: NO_CACHE_HEADERS });
    }

    if (path.startsWith('products/') && path.includes('/related')) {
      const slug = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({ slug });
      
      if (!product || !isProductActive(product)) {
        return errorResponse('Product not found or unavailable', 404);
      }

      const related = await productsCol
        .find({
          category: product.category,
          slug: { $ne: slug },
          ...ACTIVE_PRODUCT_FILTER
        })
        .limit(4)
        .toArray();
      
      return NextResponse.json({ products: related.map(sanitizePublicProduct) }, { headers: NO_CACHE_HEADERS });
    }

    if (path.startsWith('products/')) {
      const slug = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne(buildIdQuery(slug));
      
      if (!product || !isProductActive(product)) {
        return errorResponse('Product not found or is currently unavailable', 404);
      }
      
      return NextResponse.json({ product: sanitizePublicProduct(product) }, { headers: NO_CACHE_HEADERS });
    }

    // Categories endpoint - calculates accurate active products count
    if (path === 'categories') {
      const categoriesCol = await getCollection('categories');
      const productsCol = await getCollection('products');
      const [categories, activeProducts] = await Promise.all([
        categoriesCol.find({}).toArray(),
        productsCol.find(ACTIVE_PRODUCT_FILTER).toArray()
      ]);

      const counts = {};
      for (const p of activeProducts) {
        if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
      }

      const updatedCategories = categories.map(cat => ({
        _id: cat._id, name: cat.name, slug: cat.slug, image: cat.image, description: cat.description,
        productCount: counts[cat.name] || 0
      }));

      return NextResponse.json({ categories: updatedCategories }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'orders/track') return errorResponse('Use the tracking form', 405);

    // Orders confirmation receipt endpoint (Public view sanitized)
    if (path.startsWith('orders/') && !path.includes('track')) {
      const orderId = path.split('/')[1];
      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne(buildIdQuery(orderId));
      
      if (!order) {
        return errorResponse('Order not found', 404);
      }
      
      const suppliedToken = request.headers.get('x-order-token') || '';
      const storedToken = order.receiptToken || '';
      if (!storedToken || Buffer.byteLength(suppliedToken) !== Buffer.byteLength(storedToken) || !timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(storedToken))) return errorResponse('Order not found', 404);
      const safeOrder = {
        _id: order._id,
        orderNumber: order.orderNumber || order._id,
        status: order.status || 'pending',
        createdAt: order.createdAt,
        // This endpoint is addressable by order ID from a browser URL. Do not
        // expose customer PII or line-item details without phone verification.
        subtotal: order.subtotal || order.pricing?.subtotal || 0,
        shipping: order.shipping ?? order.pricing?.shipping ?? 200,
        total: order.total || order.pricing?.total || 0,
        paymentMethod: order.paymentMethod || 'cod'
      };

      return NextResponse.json({ order: safeOrder }, { headers: NO_CACHE_HEADERS });
    }

    // Reviews endpoint
    if (path.startsWith('reviews/')) {
      const productId = path.split('/')[1];
      const reviewsCol = await getCollection('reviews');
      const reviews = await reviewsCol
        .find({
          $or: [{ productId: productId }, { productSlug: productId }],
          status: 'approved'
        })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ reviews: reviews.map(({ _id, name, rating, comment, verified, createdAt }) => ({ _id, name, rating, comment, verified: verified === true, createdAt })) }, { headers: NO_CACHE_HEADERS });
    }

    // Search endpoint with suggestions
    if (path === 'search') {
      const query = literalSearch(searchParams.get('q'));
      if (!query) {
        return NextResponse.json({ suggestions: [], products: [] }, { headers: NO_CACHE_HEADERS });
      }

      const productsCol = await getCollection('products');
      
      // Get suggestions (active product names only)
      const suggestions = await productsCol
        .find({
          ...ACTIVE_PRODUCT_FILTER,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .project({ name: 1, category: 1 })
        .toArray();

      // Get full products (active products only)
      const products = await productsCol
        .find({
          ...ACTIVE_PRODUCT_FILTER,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(20)
        .toArray();

      return NextResponse.json({ 
        suggestions: suggestions.map(s => s.name), 
        products: products.map(sanitizePublicProduct),
        query
      }, { headers: NO_CACHE_HEADERS });
    }

    // Public store settings endpoint
    if (path === 'settings') {
      const settingsCol = await getCollection('settings');
      const settings = (await settingsCol.findOne({ type: 'general' })) || {};
      const safeSettings = {
        businessName: settings.businessName || 'Burhan',
        tagline: settings.tagline || 'Powering Your Digital Lifestyle',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        phone: settings.phone || '03013301830',
        whatsapp: settings.whatsapp || '03150693148',
        email: settings.email || 'infoburhancommunication@gmail.com',
        address: settings.address || 'Karachi, Sindh, Pakistan',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        tiktok: settings.tiktok || '',
        twitter: settings.twitter || '',
        youtube: settings.youtube || '',
        currency: settings.currency || 'PKR',
        shippingFee: resolveShippingFee(settings),
        shippingRules: Array.isArray(settings.shippingRules) ? settings.shippingRules : [],
        paymentMethods: ['cod'],
        turnstileSiteKey: process.env.TURNSTILE_SECRET_KEY ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '' : '',
      };
      return NextResponse.json({ settings: safeSettings }, { headers: NO_CACHE_HEADERS });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.status ? error.message : 'Unable to process request', error.status || 500);
  }
}

// POST handler
export async function POST(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  try {
    // Validate cart items against real database stock, prices, and status
    if (path === 'cart/validate') {
      await consumeRateLimit('cart-validation', clientAddress(request), 120, 15 * 60 * 1000);
      const body = await readJsonBody(request);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length > 50) return errorResponse('Too many cart lines', 400);
      const productsCol = await getCollection('products');

      const validated = [];
      const issues = [];
      const usedStock = new Map();
      const lines = new Map();
      for (const item of items) {
        const prodId = item?.productId || item?._id;
        if (typeof prodId !== 'string' || prodId.length > 128 || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) < 1) return errorResponse('Invalid cart item', 400);
        const product = await productsCol.findOne(buildIdQuery(prodId));
        if (!product || !isProductActive(product)) { issues.push({ id: prodId, reason: 'unavailable', message: 'An item is no longer available. Please review your cart.' }); continue; }
        let selection;
        try { selection = resolveColourSelection(product, item.variantId ?? ''); }
        catch (error) { issues.push({ id: prodId, reason: 'colour_unavailable', message: error.message }); continue; }
        const stock = Math.max(0, Number(product.stock) || 0);
        const productKey = String(product._id);
        const requestedQty = Number(item.quantity);
        const allowedQty = Math.min(requestedQty, Math.max(0, stock - (usedStock.get(productKey) || 0)));
        if (allowedQty < requestedQty) issues.push({ id: prodId, reason: 'stock_limited', message: `Availability changed for "${product.name}". Please review the quantities in your cart.` });
        if (!allowedQty) continue;
        usedStock.set(productKey, (usedStock.get(productKey) || 0) + allowedQty);
        const line = { ...publicProduct(product), productId: product._id, ...selection, basePrice: product.price, quantity: allowedQty, stock };
        line.cartKey = cartLineKey(line);
        const previous = lines.get(line.cartKey);
        lines.set(line.cartKey, { ...line, quantity: (previous?.quantity || 0) + allowedQty });
      }
      validated.push(...lines.values());
      return NextResponse.json({ valid: issues.length === 0, items: validated, issues }, { headers: NO_CACHE_HEADERS });
    }

    // Create order - WITH SERVER-SIDE PRICE VALIDATION & ACTIVE CHECK
    if (path === 'orders') {
      const body = await readJsonBody(request);
      await consumeRateLimit('order-requests-ip', clientAddress(request), 60, 15 * 60 * 1000);
      if (body.website) return errorResponse('Unable to place order', 400);
      if (typeof body.clientReferenceId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(body.clientReferenceId)) return errorResponse('Please refresh checkout and try again', 400);
      const ordersCol = await getCollection('orders');
      const productsCol = await getCollection('products');
      
      // SECURITY: Validate and recalculate prices server-side
      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return errorResponse('Order must contain at least one item', 400);
      }
      
      if (!body.customer || !body.customer.name || !body.customer.phone || !body.customer.address) {
        return errorResponse('Customer information is required (name, phone, and complete shipping address)', 400);
      }

      const cleanPhone = normalizePakistaniPhone(body.customer.phone);
      if (!cleanPhone) {
        return errorResponse('Please provide a valid Pakistani mobile number', 400);
      }
      
      for (const [field, maximum] of [['name', 100], ['phone', 30], ['address', 500], ['city', 100], ['province', 100]]) {
        if (typeof body.customer[field] !== 'string' || !body.customer[field].trim() || body.customer[field].length > maximum) return errorResponse('Please check your delivery details', 400);
      }
      if (body.customer.email && (typeof body.customer.email !== 'string' || body.customer.email.length > 254)) return errorResponse('Invalid email address', 400);
      if (body.paymentMethod !== 'cod') return errorResponse('This payment method is unavailable. Please select Cash on Delivery.', 400);
      if (!String(body.customer.name).trim() || !String(body.customer.address).trim() || !String(body.customer.city || '').trim() || !String(body.customer.province || '').trim()) return errorResponse('Name, province, city and complete delivery address are required', 400);
      if (body.customer.alternatePhone && !normalizePakistaniPhone(body.customer.alternatePhone)) return errorResponse('Invalid alternate phone number', 400);
      if (body.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.customer.email))) return errorResponse('Invalid email address', 400);
      if (body.items.length > 100) return errorResponse('Too many items in order', 400);
      // Recover an accepted checkout before checking current stock or prices. Its
      // own reservation may have consumed the final units; a retry must not fail.
      if (body.clientReferenceId) {
        const accepted = await ordersCol.findOne({ clientReferenceId: String(body.clientReferenceId).trim() });
        if (accepted) {
          const quantities = new Map();
          for (const item of body.items) {
            if (!item || typeof item !== 'object') return errorResponse('Invalid item in order', 400);
            if (item.variantId != null && typeof item.variantId !== 'string') return errorResponse('Invalid colour in order', 400);
            const id = String(item.productId || item._id || '');
            const variantId = item.variantId || (id === 'burhan-pro-2-flagship' ? 'white' : '');
            if (typeof variantId !== 'string' || (variantId && !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(variantId))) return errorResponse('Invalid colour in order', 400);
            const quantity = Number(item.quantity);
            if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) return errorResponse('Invalid item in order', 400);
            const key = JSON.stringify([id, variantId]);
            const previous = quantities.get(key);
            quantities.set(key, { productId: id, variantId, quantity: (previous?.quantity || 0) + quantity });
          }
          const retry = { customer: body.customer, paymentMethod: body.paymentMethod, items: [...quantities.values()], subtotal: accepted.subtotal, total: accepted.total };
          if (!areOrdersPayloadCompatible(accepted, retry)) return errorResponse('This checkout reference was already processed with different order details.', 409);
          return NextResponse.json({ order: accepted, success: true, notification: { ok: true, status: 'already_processed', dedupeKey: accepted.clientReferenceId } }, { headers: NO_CACHE_HEADERS });
        }
      }
      // Recalculate subtotal from actual product prices in database and coalesce
      // duplicate lines so one order cannot bypass aggregate stock validation.
      let calculatedSubtotal = 0;
      const validatedItems = [];
      const quantitiesByProduct = new Map();
      const productsById = new Map();
      const linesBySelection = new Map();

      for (const item of body.items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return errorResponse('Invalid order item', 400);
        const prodId = item.productId || item._id;
        const requestedQty = Number(item.quantity);
        if (typeof prodId !== 'string' || prodId.length > 128 || !Number.isSafeInteger(requestedQty) || requestedQty < 1 || requestedQty > 100) {
          return errorResponse('Invalid item in order', 400);
        }
        
        // Fetch actual product price and status from database
        const product = await productsCol.findOne(buildIdQuery(prodId));
        if (!product) {
          return errorResponse(`Product not found: ${item.name || prodId}`, 404);
        }

        if (!isProductActive(product)) {
          return errorResponse(`Product "${product.name}" is currently unavailable for purchase.`, 400);
        }
        
        const selection = resolveColourSelection(product, item.variantId ?? '');
        const lineKey = cartLineKey({ productId: product._id, ...selection });
        const previousLine = linesBySelection.get(lineKey);
        linesBySelection.set(lineKey, { product, selection, quantity: (previousLine?.quantity || 0) + requestedQty });
        const productKey = String(product._id);
        const totalRequestedQty = (quantitiesByProduct.get(productKey) || 0) + requestedQty;
        quantitiesByProduct.set(productKey, totalRequestedQty);
        productsById.set(productKey, product);
        
        // Use server-side price, never client-provided price
      }

      for (const [productKey, requestedQty] of quantitiesByProduct) {
        const product = productsById.get(productKey);
        const availableStock = Number(product.stock) || 0;
        if (availableStock < requestedQty) {
          return errorResponse(`Insufficient stock for "${product.name}". Only ${availableStock} unit(s) remaining.`, 400);
        }

      }
      for (const { product, selection, quantity } of linesBySelection.values()) {
        calculatedSubtotal = (Math.round(calculatedSubtotal * 100) + Math.round(selection.price * 100) * quantity) / 100;
        validatedItems.push({ productId: product._id, name: product.name, ...selection, quantity, image: product.image || product.thumbnail || product.images?.[0] || '' });
      }
      
      const settingsCol = await getCollection('settings');
      const settings = await settingsCol.findOne({ type: 'general' }) || {};
      const shipping = resolveShippingFee(settings, body.customer);
      const calculatedTotal = calculatedSubtotal + shipping;
      validateOrderLimits(validatedItems, calculatedTotal);
      await verifyHumanCheck(body.humanToken);
      await consumeRateLimit('new-order-phone', cleanPhone, 3, 15 * 60 * 1000);
      await consumeRateLimit('new-order-ip', clientAddress(request), 8, 15 * 60 * 1000);
      
      const order = {
        _id: uuidv4(),
        receiptToken: randomBytes(32).toString('hex'),
        items: validatedItems,
        customer: {
          name: String(body.customer.name).trim(),
          email: body.customer.email ? String(body.customer.email).trim() : '',
          phone: cleanPhone,
          alternatePhone: body.customer.alternatePhone ? normalizePakistaniPhone(body.customer.alternatePhone) : '',
          province: body.customer.province ? String(body.customer.province).trim() : '',
          city: body.customer.city ? String(body.customer.city).trim() : '',
          address: String(body.customer.address).trim(),
          postalCode: body.customer.postalCode ? String(body.customer.postalCode).trim() : ''
        },
        subtotal: calculatedSubtotal,
        shipping: shipping,
        total: calculatedTotal,
        paymentMethod: 'cod',
        status: 'pending',
        notes: body.notes ? String(body.notes).trim() : '',
        ...(body.clientReferenceId ? { clientReferenceId: String(body.clientReferenceId).trim() } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          { status: 'pending', timestamp: new Date().toISOString(), message: 'Order placed successfully by customer via website' }
        ]
      };

      // Idempotency: If client provides a clientReferenceId, prevent duplicate orders on network retry
      if (order.clientReferenceId) {
        const existingOrder = await ordersCol.findOne({ clientReferenceId: order.clientReferenceId });
        if (existingOrder) {
          if (!areOrdersPayloadCompatible(existingOrder, order)) {
            return errorResponse('This checkout reference was already processed with different order details.', 409);
          }
          return NextResponse.json(
            { order: existingOrder, success: true, notification: { ok: true, status: 'already_processed', dedupeKey: order.clientReferenceId } },
            { status: 200, headers: NO_CACHE_HEADERS }
          );
        }
      }

      // Reserve inventory atomically before creating the order. The stock predicate
      // prevents two concurrent checkouts from reserving the same final units.
      const reservedItems = [];
      try {
        for (const item of validatedItems) {
          const result = await productsCol.updateOne(
            { $and: [buildIdQuery(item.productId), { stock: { $gte: item.quantity } }] },
            { $inc: { stock: -item.quantity } }
          );
          if (!result || result.matchedCount !== 1) {
            throw new Error(`Inventory changed for "${item.name}". Please review your cart and try again.`);
          }
          reservedItems.push(item);
        }
      } catch (inventoryError) {
        for (const item of reservedItems) {
          await productsCol.updateOne(buildIdQuery(item.productId), { $inc: { stock: item.quantity } });
        }
        return errorResponse(inventoryError.message || 'Unable to reserve inventory. Please try again.', 409);
      }

      // Persist the order after inventory reservation succeeds
      try {
        await ordersCol.insertOne(order);
      } catch (insertError) {
        console.error('[Order Creation] Database insert error:', insertError?.message || insertError);

        // Ambiguous write handling: Verify if the order actually persisted despite an error
        let persistedOrder = null;
        let persistenceVerified = false;
        if (order.clientReferenceId) {
          try {
            persistedOrder = await ordersCol.findOne({ clientReferenceId: order.clientReferenceId });
            persistenceVerified = true;
          } catch (findErr) {
            console.error('[Order Creation] Could not verify order persistence after insert error:', findErr);
          }
        }

        if (persistedOrder) {
          // Reservation ownership comes from the persisted order ID, not the
          // driver's error type: a concurrent winner can also surface a timeout.
          if (String(persistedOrder._id) !== String(order._id)) {
            for (const item of reservedItems) {
              await productsCol.updateOne(buildIdQuery(item.productId), { $inc: { stock: item.quantity } });
            }
          }

          if (areOrdersPayloadCompatible(persistedOrder, order)) {
            return NextResponse.json(
              { order: persistedOrder, success: true, notification: { ok: true, status: 'already_processed', dedupeKey: order.clientReferenceId } },
              { status: 200, headers: NO_CACHE_HEADERS }
            );
          } else {
            return errorResponse('This checkout reference was already processed with different order details.', 409);
          }
        }

        // A failed verification or lost acknowledgement cannot prove the write
        // failed. Keep inventory held rather than making accepted units sellable.
        // Operators can reconcile the IDs in private server logs after recovery.
        const definitivelyRejected = [11000, 121].includes(insertError.code);
        if (!persistenceVerified || !definitivelyRejected) {
          console.error('[Order Creation] Inventory reconciliation required', { orderId: order._id, clientReferenceId: order.clientReferenceId });
          return errorResponse('Order confirmation is temporarily unavailable. Please retry this checkout without changing your details, or contact the store.', 503);
        }

        // A verified definitive insert rejection permits reservation rollback.
        for (const item of reservedItems) {
          await productsCol.updateOne(buildIdQuery(item.productId), { $inc: { stock: item.quantity } });
        }

        return errorResponse('Failed to record order. Please try again.', 500);
      }

      // Notify only after the order and inventory reservation are persisted.
      // A Resend outage is recorded/logged but never invalidates the order.
      let notification = null;
      try {
        notification = await notifyOrderCustomer(order, 'order_confirmation');
      } catch (notificationError) {
        console.warn('[Order notification] Delivery attempt failed:', notificationError?.message || notificationError);
        notification = { ok: false, status: 'failed', code: 'NOTIFICATION_EXCEPTION' };
      }

      // Revalidate storefront cache immediately so stock changes reflect publicly
      for (const item of validatedItems) {
        revalidateStorefront('', '');
      }

      return NextResponse.json({ order, success: true, notification }, { status: 201, headers: NO_CACHE_HEADERS });
    }

    // Tracking reveals only a sanitized order after ID and complete phone verification.
    if (path === 'orders/track') {
      const { orderId, phone } = await readJsonBody(request);
      await consumeRateLimit('order-tracking-ip', clientAddress(request), 30, 15 * 60 * 1000);
      const normalized = normalizePakistaniPhone(phone);
      const id = typeof orderId === 'string' ? orderId.trim() : '';
      if (!normalized || id.length < 12 || id.length > 100 || !/^[A-Za-z0-9_-]+$/.test(id)) return errorResponse('Valid Order ID and complete mobile number are required', 400);
      const variants = [normalized, '92' + normalized.slice(1), '+92' + normalized.slice(1)];
      const ordersCol = await getCollection('orders');
      const matchedOrder = await ordersCol.findOne({ $and: [{ $or: [{ _id: { $regex: '^' + literalSearch(id), $options: 'i' } }, { orderNumber: id }] }, { $or: [{ 'customer.phone': { $in: variants } }, { 'customer.alternatePhone': { $in: variants } }] }] });
      if (!matchedOrder) return errorResponse('Order not found. Check your Order ID and phone number.', 404);
      return NextResponse.json({ order: sanitizeTrackedOrder(matchedOrder) }, { headers: NO_CACHE_HEADERS });
    }

    // Customer review submission: POST /api/reviews
    if (path === 'reviews') {
      const body = await readJsonBody(request);
      await consumeRateLimit('review-ip', clientAddress(request), 5, 60 * 60 * 1000);
      const { productId, name, rating, comment } = body || {};
      if (typeof name !== 'string' || typeof comment !== 'string' || name.length > 100 || comment.length > 2000 || typeof productId !== 'string') return errorResponse('Invalid review', 400);

      if (!productId || !name?.trim() || !comment?.trim()) {
        return errorResponse('Product ID, your name, and a review comment are required', 400);
      }

      const reviewsCol = await getCollection('reviews');
      const productsCol = await getCollection('products');

      const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

      // Buyer identity must be verified by an authenticated order-specific flow.
      const isVerifiedBuyer = false;

      const newReview = {
        _id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        productId: String(productId),
        name: String(name).trim(),
        rating: numericRating,
        comment: String(comment).trim(),
        verified: isVerifiedBuyer,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await reviewsCol.insertOne(newReview);

      // Recalculate product review count & average rating
      const allProdReviews = await reviewsCol.find({
        $or: [{ productId: String(productId) }, { productSlug: String(productId) }],
        status: 'approved'
      }).toArray();

      const avgRating = allProdReviews.length > 0
        ? parseFloat((allProdReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / allProdReviews.length).toFixed(1))
        : numericRating;

      await productsCol.updateOne(
        { $or: [{ _id: productId }, { slug: productId }] },
        {
          $set: {
            rating: avgRating,
            reviewCount: allProdReviews.length
          }
        }
      );

      return NextResponse.json({ success: true, review: newReview }, { status: 201, headers: NO_CACHE_HEADERS });
    }

    // SECURITY: End of API endpoints
    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.status ? error.message : 'Unable to process request', error.status || 500);
  }
}

