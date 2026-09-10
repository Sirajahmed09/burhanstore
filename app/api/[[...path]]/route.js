import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';

// Helper function to handle errors
function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
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
      return NextResponse.json({ message: 'Burhan eCommerce API v1.0' });
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
        status: { $ne: 'inactive' }
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
      });
    }

    if (path === 'products/featured') {
      const productsCol = await getCollection('products');
      const products = await productsCol.find({ isFeatured: true }).limit(8).toArray();
      return NextResponse.json({ products });
    }

    if (path === 'products/trending') {
      const productsCol = await getCollection('products');
      const products = await productsCol.find({ isTrending: true }).limit(8).toArray();
      return NextResponse.json({ products });
    }

    if (path === 'products/best-sellers') {
      const productsCol = await getCollection('products');
      const products = await productsCol.find({}).sort({ reviewCount: -1, rating: -1 }).limit(8).toArray();
      return NextResponse.json({ products });
    }

    if (path.startsWith('products/') && path.includes('/related')) {
      const slug = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({ slug });
      
      if (!product) {
        return errorResponse('Product not found', 404);
      }

      const related = await productsCol
        .find({ category: product.category, slug: { $ne: slug } })
        .limit(4)
        .toArray();
      
      return NextResponse.json({ products: related });
    }

    if (path.startsWith('products/')) {
      const slug = path.split('/')[1];
      const productsCol = await getCollection('products');
      const product = await productsCol.findOne({ slug });
      
      if (!product) {
        return errorResponse('Product not found', 404);
      }
      
      return NextResponse.json({ product });
    }

    // Categories endpoint
    if (path === 'categories') {
      const categoriesCol = await getCollection('categories');
      const categories = await categoriesCol.find({}).toArray();
      return NextResponse.json({ categories });
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

      return NextResponse.json({ order: matchedOrder });
    }

    // Orders endpoint
    if (path.startsWith('orders/') && !path.includes('track')) {
      const orderId = path.split('/')[1];
      const ordersCol = await getCollection('orders');
      const order = await ordersCol.findOne({ _id: orderId });
      
      if (!order) {
        return errorResponse('Order not found', 404);
      }
      
      return NextResponse.json({ order });
    }

    // Reviews endpoint
    if (path.startsWith('reviews/')) {
      const productId = path.split('/')[1];
      const reviewsCol = await getCollection('reviews');
      const reviews = await reviewsCol
        .find({ productId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ reviews });
    }

    // Search endpoint with suggestions
    if (path === 'search') {
      const query = searchParams.get('q') || '';
      if (!query) {
        return NextResponse.json({ suggestions: [], products: [] });
      }

      const productsCol = await getCollection('products');
      
      // Get suggestions (product names)
      const suggestions = await productsCol
        .find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .project({ name: 1, category: 1 })
        .toArray();

      // Get full products
      const products = await productsCol
        .find({
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
      });
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
    // Create order - WITH SERVER-SIDE PRICE VALIDATION
    if (path === 'orders') {
      const ordersCol = await getCollection('orders');
      const productsCol = await getCollection('products');
      const body = await request.json();
      
      // SECURITY: Validate and recalculate prices server-side
      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return errorResponse('Order must contain at least one item', 400);
      }
      
      if (!body.customer || !body.customer.name || !body.customer.phone || !body.customer.address) {
        return errorResponse('Customer information is required', 400);
      }
      
      // Recalculate subtotal from actual product prices
      let calculatedSubtotal = 0;
      const validatedItems = [];
      
      for (const item of body.items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return errorResponse('Invalid item in order', 400);
        }
        
        // Fetch actual product price from database
        const product = await productsCol.findOne({ _id: item.productId });
        if (!product) {
          return errorResponse(`Product not found: ${item.productId}`, 404);
        }
        
        if (product.stock < item.quantity) {
          return errorResponse(`Insufficient stock for ${product.name}`, 400);
        }
        
        // Use server-side price, not client-provided price
        const itemTotal = product.price * item.quantity;
        calculatedSubtotal += itemTotal;
        
        validatedItems.push({
          productId: product._id,
          name: product.name,
          price: product.price, // Server-side price
          quantity: item.quantity,
          image: product.image || product.thumbnail || item.image
        });
      }
      
      const shipping = body.shipping !== undefined ? Number(body.shipping) : 200; // Fixed shipping cost
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
        paymentMethod: body.paymentMethod || 'cod',
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

      return NextResponse.json({ order, success: true }, { status: 201 });
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
      
      return NextResponse.json({ order: matchedOrder });
    }

    // SECURITY FIX: Removed public seed endpoint
    // Seeding must only be done through secure server-side scripts

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse(error.message);
  }
}

// Seed database with sample data
async function seedDatabase() {
  const productsCol = await getCollection('products');
  const categoriesCol = await getCollection('categories');

  // Clear existing data
  await productsCol.deleteMany({});
  await categoriesCol.deleteMany({});

  // Seed categories
  const categories = [
    {
      _id: uuidv4(),
      name: 'Wireless Earbuds',
      slug: 'wireless-earbuds',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
      description: 'Premium wireless earbuds with superior sound quality',
      productCount: 0
    },
    {
      _id: uuidv4(),
      name: 'Headphones',
      slug: 'headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      description: 'High-quality over-ear and on-ear headphones',
      productCount: 0
    },
    {
      _id: uuidv4(),
      name: 'Chargers',
      slug: 'chargers',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500',
      description: 'Fast charging solutions for all your devices',
      productCount: 0
    },
    {
      _id: uuidv4(),
      name: 'Power Banks',
      slug: 'power-banks',
      image: 'https://images.unsplash.com/photo-1609592043357-554eb9496153?w=500',
      description: 'Portable power for life on the go',
      productCount: 0
    },
    {
      _id: uuidv4(),
      name: 'Smart Watches',
      slug: 'smart-watches',
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
      description: 'Stay connected with smart wearable technology',
      productCount: 0
    },
    {
      _id: uuidv4(),
      name: 'Gaming Accessories',
      slug: 'gaming-accessories',
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500',
      description: 'Level up your gaming experience',
      productCount: 0
    }
  ];

  await categoriesCol.insertMany(categories);

  // Seed products
  const products = [
    // Wireless Earbuds
    {
      _id: uuidv4(),
      name: 'Burhan AirPods Pro Max',
      slug: 'burhan-airpods-pro-max',
      category: 'Wireless Earbuds',
      price: 8999,
      oldPrice: 12999,
      discount: 31,
      images: [
        'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
        'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
      description: 'Experience premium sound quality with active noise cancellation. Perfect for music lovers and professionals.',
      features: [
        'Active Noise Cancellation (ANC)',
        'Transparency Mode',
        'Spatial Audio',
        'Up to 6 hours battery life',
        'IPX4 Water Resistance',
        'Touch Controls'
      ],
      specifications: {
        'Battery Life': '6 hours (ANC on), 30 hours with case',
        'Bluetooth': '5.3',
        'Charging': 'USB-C Fast Charging',
        'Weight': '5.4g per earbud',
        'Driver': '12mm Dynamic Driver',
        'Frequency Response': '20Hz - 20kHz'
      },
      inBox: ['Earbuds', 'Charging Case', '3 Ear Tips Sizes', 'USB-C Cable', 'User Manual'],
      stock: 45,
      sku: 'BRH-ARP-MAX-001',
      rating: 4.8,
      reviewCount: 127,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      warranty: '1 Year Official Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan Elite Buds',
      slug: 'burhan-elite-buds',
      category: 'Wireless Earbuds',
      price: 5499,
      oldPrice: 7999,
      discount: 31,
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
        'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
      description: 'Affordable excellence. Crystal clear sound with long battery life.',
      features: [
        'Environmental Noise Cancellation',
        'Gaming Mode (Low Latency)',
        'Up to 8 hours playback',
        'IPX5 Water Resistance',
        'Touch Controls'
      ],
      specifications: {
        'Battery Life': '8 hours, 40 hours with case',
        'Bluetooth': '5.2',
        'Charging': 'USB-C',
        'Weight': '4.2g per earbud',
        'Driver': '10mm Dynamic Driver'
      },
      inBox: ['Earbuds', 'Charging Case', 'Ear Tips', 'USB-C Cable', 'Manual'],
      stock: 67,
      sku: 'BRH-EB-001',
      rating: 4.6,
      reviewCount: 93,
      isNew: false,
      isTrending: true,
      isFeatured: true,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    
    // Headphones
    {
      _id: uuidv4(),
      name: 'Burhan Studio Pro Headphones',
      slug: 'burhan-studio-pro-headphones',
      category: 'Headphones',
      price: 12999,
      oldPrice: 18999,
      discount: 32,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      description: 'Professional studio-grade headphones with exceptional sound clarity.',
      features: [
        'Premium 40mm Drivers',
        'Active Noise Cancellation',
        'Wired & Wireless Modes',
        'Up to 50 hours battery',
        'Foldable Design',
        'Premium Leather Cushions'
      ],
      specifications: {
        'Battery Life': '50 hours (Bluetooth), Unlimited (Wired)',
        'Bluetooth': '5.3',
        'Frequency Response': '15Hz - 30kHz',
        'Impedance': '32 Ohms',
        'Weight': '285g'
      },
      inBox: ['Headphones', '3.5mm Audio Cable', 'USB-C Cable', 'Carrying Case', 'Manual'],
      stock: 23,
      sku: 'BRH-SP-001',
      rating: 4.9,
      reviewCount: 156,
      isNew: true,
      isTrending: false,
      isFeatured: true,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },

    // Chargers
    {
      _id: uuidv4(),
      name: 'Burhan 65W GaN Fast Charger',
      slug: 'burhan-65w-gan-charger',
      category: 'Chargers',
      price: 3499,
      oldPrice: 4999,
      discount: 30,
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400',
      description: 'Ultra-compact 65W GaN charger. Charge laptops, tablets, and phones at maximum speed.',
      features: [
        '65W Power Delivery',
        'GaN Technology',
        'Dual USB-C Ports',
        'Compact Design',
        'Universal Compatibility',
        'Multiple Safety Protections'
      ],
      specifications: {
        'Output': '65W Max (Single Port), 45W+18W (Dual Port)',
        'Input': '100-240V 50/60Hz',
        'Ports': '2x USB-C',
        'Size': '6.5 x 4 x 3 cm',
        'Weight': '120g'
      },
      inBox: ['Charger', 'User Manual'],
      stock: 89,
      sku: 'BRH-65W-GAN-001',
      rating: 4.7,
      reviewCount: 234,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan 20W USB-C Fast Charger',
      slug: 'burhan-20w-usb-c-charger',
      category: 'Chargers',
      price: 1299,
      oldPrice: 1999,
      discount: 35,
      images: [
        'https://images.unsplash.com/photo-1591290619762-ffe7ba26521a?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1591290619762-ffe7ba26521a?w=400',
      description: 'Compact and efficient 20W fast charger perfect for smartphones.',
      features: [
        '20W Power Delivery',
        'USB-C Port',
        'Compact Size',
        'Universal Phone Compatibility',
        'Safety Protection'
      ],
      specifications: {
        'Output': '20W Max',
        'Input': '100-240V',
        'Port': '1x USB-C',
        'Weight': '45g'
      },
      inBox: ['Charger', 'Manual'],
      stock: 156,
      sku: 'BRH-20W-001',
      rating: 4.5,
      reviewCount: 189,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '6 Months Warranty',
      createdAt: new Date()
    },

    // Power Banks
    {
      _id: uuidv4(),
      name: 'Burhan PowerMax 20000mAh',
      slug: 'burhan-powermax-20000',
      category: 'Power Banks',
      price: 4999,
      oldPrice: 6999,
      discount: 29,
      images: [
        'https://images.unsplash.com/photo-1609592043357-554eb9496153?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1609592043357-554eb9496153?w=400',
      description: 'Massive 20000mAh capacity power bank with 65W fast charging.',
      features: [
        '20000mAh Capacity',
        '65W Power Delivery',
        'Dual USB-C + USB-A',
        'LED Display',
        'Fast Charging Input & Output',
        'Charge 3 Devices Simultaneously'
      ],
      specifications: {
        'Capacity': '20000mAh',
        'Input': 'USB-C 65W',
        'Output': 'USB-C1 65W, USB-C2 30W, USB-A 22.5W',
        'Size': '15 x 7 x 3 cm',
        'Weight': '410g'
      },
      inBox: ['Power Bank', 'USB-C Cable', 'User Manual', 'Travel Pouch'],
      stock: 34,
      sku: 'BRH-PM-20K',
      rating: 4.8,
      reviewCount: 145,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan Slim 10000mAh',
      slug: 'burhan-slim-10000',
      category: 'Power Banks',
      price: 2999,
      oldPrice: 3999,
      discount: 25,
      images: [
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
      description: 'Ultra-slim design power bank. Perfect for daily carry.',
      features: [
        '10000mAh Capacity',
        'Slim Design (1.5cm)',
        '20W Fast Charging',
        'Dual Ports',
        'LED Indicator'
      ],
      specifications: {
        'Capacity': '10000mAh',
        'Output': 'USB-C 20W, USB-A 18W',
        'Size': '14 x 6.8 x 1.5 cm',
        'Weight': '195g'
      },
      inBox: ['Power Bank', 'USB-C Cable', 'Manual'],
      stock: 78,
      sku: 'BRH-SL-10K',
      rating: 4.6,
      reviewCount: 98,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },

    // Smart Watches
    {
      _id: uuidv4(),
      name: 'Burhan SmartWatch Ultra',
      slug: 'burhan-smartwatch-ultra',
      category: 'Smart Watches',
      price: 9999,
      oldPrice: 14999,
      discount: 33,
      images: [
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
        'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
      description: 'Premium smartwatch with AMOLED display and comprehensive health tracking.',
      features: [
        '1.43" AMOLED Display',
        'Heart Rate Monitor',
        'SpO2 Sensor',
        'Sleep Tracking',
        '100+ Sports Modes',
        'IP68 Water Resistance',
        '7 Days Battery Life',
        'Bluetooth Calling'
      ],
      specifications: {
        'Display': '1.43" AMOLED 466x466',
        'Battery': '300mAh (7 days)',
        'Bluetooth': '5.2',
        'Sensors': 'Heart Rate, SpO2, Accelerometer, Gyroscope',
        'Water Resistance': 'IP68',
        'Weight': '48g'
      },
      inBox: ['Smart Watch', 'Charging Cable', 'Extra Strap', 'User Manual'],
      stock: 28,
      sku: 'BRH-SW-ULTRA',
      rating: 4.7,
      reviewCount: 112,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },

    // Gaming Accessories
    {
      _id: uuidv4(),
      name: 'Burhan Gaming Headset Pro',
      slug: 'burhan-gaming-headset-pro',
      category: 'Gaming Accessories',
      price: 6999,
      oldPrice: 9999,
      discount: 30,
      images: [
        'https://images.unsplash.com/photo-1599669454699-248893623440?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400',
      description: '7.1 Surround sound gaming headset with RGB lighting and premium microphone.',
      features: [
        '7.1 Virtual Surround Sound',
        'RGB Lighting',
        'Noise Cancelling Microphone',
        '50mm Drivers',
        'Memory Foam Cushions',
        'Multi-Platform Compatible'
      ],
      specifications: {
        'Driver': '50mm Neodymium',
        'Frequency': '20Hz - 20kHz',
        'Impedance': '32 Ohms',
        'Cable': '2m Braided',
        'Weight': '320g'
      },
      inBox: ['Gaming Headset', 'USB Adapter', 'User Manual'],
      stock: 45,
      sku: 'BRH-GH-PRO',
      rating: 4.8,
      reviewCount: 167,
      isNew: false,
      isTrending: true,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan RGB Gaming Mouse',
      slug: 'burhan-rgb-gaming-mouse',
      category: 'Gaming Accessories',
      price: 3499,
      oldPrice: 4999,
      discount: 30,
      images: [
        'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
      description: 'Precision gaming mouse with adjustable DPI and customizable RGB.',
      features: [
        'Up to 12000 DPI',
        '7 Programmable Buttons',
        'RGB Lighting (16.8M Colors)',
        'PMW3327 Sensor',
        'Ergonomic Design',
        'Braided Cable'
      ],
      specifications: {
        'DPI': '200-12000',
        'Polling Rate': '1000Hz',
        'Buttons': '7 Programmable',
        'Cable': '1.8m Braided',
        'Weight': '95g'
      },
      inBox: ['Gaming Mouse', 'User Manual'],
      stock: 67,
      sku: 'BRH-GM-RGB',
      rating: 4.6,
      reviewCount: 89,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    
    // Additional diverse products
    {
      _id: uuidv4(),
      name: 'Burhan USB-C Hub 7-in-1',
      slug: 'burhan-usb-c-hub',
      category: 'Gaming Accessories',
      price: 4499,
      oldPrice: 5999,
      discount: 25,
      images: [
        'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
      description: 'Expand your connectivity with 7 ports in one compact hub.',
      features: [
        '4K HDMI Output',
        '3x USB 3.0 Ports',
        'SD/TF Card Reader',
        'USB-C PD Charging',
        'Aluminum Body'
      ],
      specifications: {
        'HDMI': '4K@30Hz',
        'USB': '3x USB 3.0 (5Gbps)',
        'Card Reader': 'SD/TF',
        'Power Delivery': 'Up to 100W',
        'Material': 'Aluminum Alloy'
      },
      inBox: ['USB-C Hub', 'User Manual'],
      stock: 52,
      sku: 'BRH-HUB-7IN1',
      rating: 4.5,
      reviewCount: 67,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan MagSafe Wireless Charger',
      slug: 'burhan-magsafe-charger',
      category: 'Chargers',
      price: 2999,
      oldPrice: 4499,
      discount: 33,
      images: [
        'https://images.unsplash.com/photo-1621339146034-c796860f7e04?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1621339146034-c796860f7e04?w=400',
      description: 'MagSafe compatible wireless charger with 15W fast charging.',
      features: [
        '15W Wireless Charging',
        'MagSafe Compatible',
        'LED Indicator',
        'Foreign Object Detection',
        'Non-Slip Base'
      ],
      specifications: {
        'Output': '15W/10W/7.5W/5W',
        'Input': 'USB-C (20W)',
        'Compatibility': 'iPhone 12 and newer',
        'Size': '60mm diameter',
        'Weight': '65g'
      },
      inBox: ['Wireless Charger', 'USB-C Cable', 'Manual'],
      stock: 94,
      sku: 'BRH-MAG-15W',
      rating: 4.7,
      reviewCount: 143,
      isNew: true,
      isTrending: false,
      isFeatured: false,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan Bluetooth Speaker Max',
      slug: 'burhan-speaker-max',
      category: 'Wireless Earbuds',
      price: 5999,
      oldPrice: 8999,
      discount: 33,
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      description: 'Powerful portable Bluetooth speaker with 360° sound and RGB lights.',
      features: [
        '360° Surround Sound',
        'RGB Light Show',
        '20W Output',
        '12 Hours Battery',
        'IPX7 Waterproof',
        'TWS Pairing'
      ],
      specifications: {
        'Power': '20W',
        'Battery': '4000mAh (12 hours)',
        'Bluetooth': '5.3',
        'Range': '15 meters',
        'Waterproof': 'IPX7',
        'Weight': '580g'
      },
      inBox: ['Bluetooth Speaker', 'USB-C Cable', 'AUX Cable', 'Manual'],
      stock: 41,
      sku: 'BRH-SPK-MAX',
      rating: 4.8,
      reviewCount: 178,
      isNew: true,
      isTrending: true,
      isFeatured: true,
      warranty: '1 Year Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan Car Charger Dual Port',
      slug: 'burhan-car-charger',
      category: 'Chargers',
      price: 1499,
      oldPrice: 2499,
      discount: 40,
      images: [
        'https://images.unsplash.com/photo-1613069298242-eb4c8e41b20d?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1613069298242-eb4c8e41b20d?w=400',
      description: 'Fast charging car charger with dual USB-C ports.',
      features: [
        'Dual USB-C Ports',
        '40W Total Output',
        'Smart Chip Protection',
        'LED Indicator',
        'Compact Design'
      ],
      specifications: {
        'Output': '20W per port',
        'Input': '12-24V',
        'Ports': '2x USB-C',
        'Size': '4cm x 2.5cm'
      },
      inBox: ['Car Charger', 'Manual'],
      stock: 123,
      sku: 'BRH-CAR-40W',
      rating: 4.4,
      reviewCount: 87,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '6 Months Warranty',
      createdAt: new Date()
    },
    {
      _id: uuidv4(),
      name: 'Burhan Phone Holder Magnetic',
      slug: 'burhan-phone-holder',
      category: 'Gaming Accessories',
      price: 899,
      oldPrice: 1499,
      discount: 40,
      images: [
        'https://images.unsplash.com/photo-1621570074981-74fd1aa1a369?w=800'
      ],
      thumbnail: 'https://images.unsplash.com/photo-1621570074981-74fd1aa1a369?w=400',
      description: 'Strong magnetic car phone holder with 360° rotation.',
      features: [
        'Strong Magnetic Hold',
        '360° Rotation',
        'Dashboard & Vent Mount',
        'Universal Compatibility',
        'One-Hand Operation'
      ],
      specifications: {
        'Magnet': 'N52 Neodymium',
        'Mount': 'Dashboard/Air Vent',
        'Rotation': '360°',
        'Weight': '45g'
      },
      inBox: ['Magnetic Holder', '2x Metal Plates', 'Manual'],
      stock: 167,
      sku: 'BRH-PH-MAG',
      rating: 4.6,
      reviewCount: 234,
      isNew: false,
      isTrending: false,
      isFeatured: false,
      warranty: '6 Months Warranty',
      createdAt: new Date()
    }
  ];

  await productsCol.insertMany(products);

  // Update product counts in categories
  for (const category of categories) {
    const count = products.filter(p => p.category === category.name).length;
    await categoriesCol.updateOne(
      { _id: category._id },
      { $set: { productCount: count } }
    );
  }

  console.log('Database seeded successfully with', products.length, 'products');
}
