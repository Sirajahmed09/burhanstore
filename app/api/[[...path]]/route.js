import { NextResponse } from 'next/server';
import { getCollection, getDatabaseStatus } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

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
  isActive: { $ne: false }
};

function isProductActive(product) {
  if (!product) return false;
  if (product.status === 'inactive' || product.status === 'hidden' || product.status === 'draft') return false;
  if (product.isActive === false) return false;
  return true;
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
      const dbStatus = getDatabaseStatus();
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          configured: dbStatus.isConfigured,
          connected: dbStatus.isConnected,
          provider: dbStatus.provider,
        }
      }, { headers: NO_CACHE_HEADERS });
    }

    // Products endpoints
    if (path === 'products') {
      const productsCol = await getCollection('products');
      
      // Get query parameters
      const category = searchParams.get('category');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const sort = searchParams.get('sort') || 'newest';
      const search = searchParams.get('search');
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
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 100;
      const skip = (page - 1) * limit;

      const products = await productsCol.find(filter).sort(sortOption).skip(skip).limit(limit).toArray();
      const total = await productsCol.countDocuments(filter);
      
      return NextResponse.json({ 
        products, 
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
      return NextResponse.json({ products }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'products/trending') {
      const productsCol = await getCollection('products');
      const products = await productsCol
        .find({ ...ACTIVE_PRODUCT_FILTER, isTrending: true })
        .limit(8)
        .toArray();
      return NextResponse.json({ products }, { headers: NO_CACHE_HEADERS });
    }

    if (path === 'products/best-sellers') {
      const productsCol = await getCollection('products');
      const products = await productsCol
        .find({ ...ACTIVE_PRODUCT_FILTER })
        .sort({ reviewCount: -1, rating: -1 })
        .limit(8)
        .toArray();
      return NextResponse.json({ products }, { headers: NO_CACHE_HEADERS });
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
      
      return NextResponse.json({ products: related }, { headers: NO_CACHE_HEADERS });
    }

    if (path.startsWith('products/')) {
      const slug = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({ slug });
      
      if (!product || !isProductActive(product)) {
        return errorResponse('Product not found or is currently unavailable', 404);
      }
      
      return NextResponse.json({ product }, { headers: NO_CACHE_HEADERS });
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
        ...cat,
        productCount: counts[cat.name] || 0
      }));

      return NextResponse.json({ categories: updatedCategories }, { headers: NO_CACHE_HEADERS });
    }

    // Order tracking endpoint (GET support)
    if (path === 'orders/track') {
      const orderId = searchParams.get('orderId') || '';
      const phone = searchParams.get('phone') || '';

      if (!orderId) {
        return errorResponse('Order ID is required', 400);
      }

      const sanitizedOrderId = String(orderId).trim().toLowerCase();
      const cleanInputPhone = phone ? String(phone).replace(/[^0-9]/g, '').slice(-10) : '';

      const ordersCol = await getCollection('orders');
      const allOrders = await ordersCol.find({}).toArray();

      const matchedOrder = allOrders.find(o => {
        const idMatches = 
          o._id.toLowerCase() === sanitizedOrderId ||
          o._id.toLowerCase().startsWith(sanitizedOrderId) ||
          sanitizedOrderId.startsWith(o._id.slice(0, 12).toLowerCase());

        if (!cleanInputPhone) return idMatches;

        const oPhone = String(o.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
        const oAltPhone = String(o.customer?.alternatePhone || '').replace(/[^0-9]/g, '').slice(-10);

        return idMatches && (oPhone === cleanInputPhone || oAltPhone === cleanInputPhone);
      });

      if (!matchedOrder) {
        return errorResponse('Order not found', 404);
      }

      return NextResponse.json({ order: matchedOrder }, { headers: NO_CACHE_HEADERS });
    }

    // Orders endpoint
    if (path.startsWith('orders/') && !path.includes('track')) {
      const orderId = path.split('/')[1];
      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: orderId });
      
      if (!order) {
        return errorResponse('Order not found', 404);
      }
      
      return NextResponse.json({ order }, { headers: NO_CACHE_HEADERS });
    }

    // Reviews endpoint
    if (path.startsWith('reviews/')) {
      const productId = path.split('/')[1];
      const reviewsCol = await getCollection('reviews');
      const reviews = await reviewsCol
        .find({ productId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ reviews }, { headers: NO_CACHE_HEADERS });
    }

    // Search endpoint with suggestions
    if (path === 'search') {
      const query = searchParams.get('q') || '';
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
        products,
        query
      }, { headers: NO_CACHE_HEADERS });
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message);
  }
}

// POST handler
export async function POST(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  try {
    // Validate cart items against real database stock, prices, and status
    if (path === 'cart/validate') {
      const body = await request.json();
      const items = Array.isArray(body.items) ? body.items : [];
      const productsCol = await getCollection('products');

      const validated = [];
      const issues = [];

      for (const item of items) {
        const prodId = item.productId || item._id;
        const product = await productsCol.findOne({ _id: prodId });

        if (!product) {
          issues.push({
            id: prodId,
            name: item.name || 'Unknown item',
            reason: 'not_found',
            message: `"${item.name || 'Item'}" is no longer available in our store.`
          });
          continue;
        }

        if (!isProductActive(product)) {
          issues.push({
            id: prodId,
            name: product.name,
            reason: 'inactive',
            message: `"${product.name}" is currently unavailable.`
          });
          continue;
        }

        const stock = Number(product.stock) || 0;
        const requestedQty = Math.max(1, parseInt(item.quantity) || 1);

        if (stock <= 0) {
          issues.push({
            id: prodId,
            name: product.name,
            reason: 'out_of_stock',
            message: `"${product.name}" is out of stock.`
          });
          continue;
        }

        const allowedQty = Math.min(requestedQty, stock);
        if (allowedQty < requestedQty) {
          issues.push({
            id: prodId,
            name: product.name,
            reason: 'stock_limited',
            message: `Only ${stock} unit(s) of "${product.name}" are currently in stock.`
          });
        }

        validated.push({
          ...item,
          _id: product._id,
          productId: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          thumbnail: product.thumbnail || product.images?.[0],
          quantity: allowedQty
        });
      }

      return NextResponse.json({
        valid: issues.length === 0,
        items: validated,
        issues
      }, { headers: NO_CACHE_HEADERS });
    }

    // Create order - WITH SERVER-SIDE PRICE VALIDATION & ACTIVE CHECK
    if (path === 'orders') {
      const ordersCol = await getCollection('orders');
      const productsCol = await getCollection('products');
      const body = await request.json();
      
      // SECURITY: Validate and recalculate prices server-side
      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return errorResponse('Order must contain at least one item', 400);
      }
      
      if (!body.customer || !body.customer.name || !body.customer.phone || !body.customer.address) {
        return errorResponse('Customer information is required (name, phone, and complete shipping address)', 400);
      }

      const cleanPhone = String(body.customer.phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        return errorResponse('Please provide a valid Pakistani contact phone number (at least 10 digits)', 400);
      }
      
      // Recalculate subtotal from actual product prices in database
      let calculatedSubtotal = 0;
      const validatedItems = [];
      
      for (const item of body.items) {
        const prodId = item.productId || item._id;
        const requestedQty = parseInt(item.quantity);
        if (!prodId || !requestedQty || requestedQty < 1) {
          return errorResponse('Invalid item in order', 400);
        }
        
        // Fetch actual product price and status from database
        const product = await productsCol.findOne({ _id: prodId });
        if (!product) {
          return errorResponse(`Product not found: ${item.name || prodId}`, 404);
        }

        if (!isProductActive(product)) {
          return errorResponse(`Product "${product.name}" is currently unavailable for purchase.`, 400);
        }
        
        const availableStock = Number(product.stock) || 0;
        if (availableStock < requestedQty) {
          return errorResponse(`Insufficient stock for "${product.name}". Only ${availableStock} unit(s) remaining.`, 400);
        }
        
        // Use server-side price, never client-provided price
        const itemTotal = Number(product.price) * requestedQty;
        calculatedSubtotal += itemTotal;
        
        validatedItems.push({
          productId: product._id,
          name: product.name,
          price: product.price, // Server-side price
          quantity: requestedQty,
          image: product.image || product.thumbnail || product.images?.[0] || item.image || ''
        });
      }
      
      const shipping = 200; // Flat shipping rate in PKR
      const calculatedTotal = calculatedSubtotal + shipping;
      
      const order = {
        _id: uuidv4(),
        items: validatedItems,
        customer: {
          name: String(body.customer.name).trim(),
          email: body.customer.email ? String(body.customer.email).trim() : '',
          phone: String(body.customer.phone).trim(),
          alternatePhone: body.customer.alternatePhone ? String(body.customer.alternatePhone).trim() : '',
          province: body.customer.province ? String(body.customer.province).trim() : '',
          city: body.customer.city ? String(body.customer.city).trim() : '',
          address: String(body.customer.address).trim(),
          postalCode: body.customer.postalCode ? String(body.customer.postalCode).trim() : ''
        },
        subtotal: calculatedSubtotal,
        shipping: shipping,
        total: calculatedTotal,
        paymentMethod: (body.paymentMethod === 'card' ? 'card' : 'cod'),
        status: 'pending',
        notes: body.notes ? String(body.notes).trim() : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          { status: 'pending', timestamp: new Date().toISOString(), message: 'Order placed successfully by customer via website' }
        ]
      };

      await ordersCol.insertOne(order);

      // Decrement stock for purchased items
      for (const item of validatedItems) {
        await productsCol.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.quantity } }
        );
      }

      // Revalidate storefront cache immediately so stock changes reflect publicly
      for (const item of validatedItems) {
        revalidateStorefront('', '');
      }

      return NextResponse.json({ order, success: true }, { status: 201, headers: NO_CACHE_HEADERS });
    }

    // Track order - WITH INPUT SANITIZATION & FLEXIBLE MATCHING
    if (path === 'orders/track') {
      const { orderId, phone } = await request.json();
      
      if (!orderId || !phone) {
        return errorResponse('Order ID and phone number are required', 400);
      }

      // Sanitize inputs
      const sanitizedOrderId = String(orderId).trim();
      const cleanInputPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
      
      if (sanitizedOrderId.length === 0 || cleanInputPhone.length === 0) {
        return errorResponse('Invalid Order ID or phone number', 400);
      }

      const ordersCol = await getCollection('orders');
      const allOrders = await ordersCol.find({}).toArray();

      const matchedOrder = allOrders.find(o => {
        const idMatches = 
          o._id.toLowerCase() === sanitizedOrderId.toLowerCase() ||
          o._id.toLowerCase().startsWith(sanitizedOrderId.toLowerCase()) ||
          sanitizedOrderId.toLowerCase().startsWith(o._id.slice(0, 12).toLowerCase());

        const oPhone = String(o.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
        const oAltPhone = String(o.customer?.alternatePhone || '').replace(/[^0-9]/g, '').slice(-10);

        const phoneMatches = 
          (oPhone && oPhone === cleanInputPhone) ||
          (oAltPhone && oAltPhone === cleanInputPhone);

        return idMatches && phoneMatches;
      });
      
      if (!matchedOrder) {
        return errorResponse('Order not found. Please check your Order ID and phone number.', 404);
      }
      
      return NextResponse.json({ order: matchedOrder }, { headers: NO_CACHE_HEADERS });
    }

    // SECURITY: End of API endpoints
    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message);
  }
}

