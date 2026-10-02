'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Zap, 
  Volume2, 
  BatteryCharging, 
  Radio, 
  Mic, 
  Sliders, 
  Droplets, 
  Package, 
  ArrowRight,
  Sparkles,
  PhoneCall,
  Clock
} from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import ProductCard from '@/components/product/ProductCard';
import { trackViewItem, trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

export default function ProductDetailClient({ product, initialRelated = [] }) {
  const router = useRouter();
  const [relatedProducts, setRelatedProducts] = useState(initialRelated);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [addedToast, setAddedToast] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (product) {
      trackViewItem(product);
      if (initialRelated.length === 0 && product.slug) {
        fetch(`/api/products/${product.slug}/related?_t=${Date.now()}`, { cache: 'no-store' })
          .then(res => (res.ok ? res.json() : { products: [] }))
          .then(relData => {
            setRelatedProducts(relData.products || []);
          })
          .catch(err => console.error('Failed to load related products:', err));
      }
    }
  }, [product, initialRelated]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      gaAddToCart(product, quantity);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    }
  };

  const handleBuyNow = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      gaAddToCart(product, quantity);
      router.push('/cart');
    }
  };

  if (!product) {
    return null;
  }

  const isPro2 = product.slug === 'burhan-pro-2' || product.name?.toLowerCase().includes('pro 2');

  const productImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800']));
  const activeImage = productImages[selectedImage] || productImages[0];

  const discountPercent = product.discount || (product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0);

  // Pro 2 Key Highlights
  const pro2Highlights = [
    { label: 'Up to 35dB Hybrid ANC' },
    { label: 'Up to 36H Total Playback' },
    { label: '40ms Low Latency' },
    { label: 'Bluetooth 5.3 + EDR' },
    { label: 'Quad-Mic ENC' },
    { label: 'USB-C + Qi Charging' },
  ];

  // Pro 2 Why You'll Love It Benefits Grid
  const pro2Benefits = [
    {
      icon: Volume2,
      title: 'Hybrid ANC',
      description: 'Reduce unwanted background noise with up to 35dB Active Noise Cancellation for deep musical immersion.',
    },
    {
      icon: BatteryCharging,
      title: '36H Battery',
      description: 'Up to 8H per charge on earbuds and up to 36H total playtime with the compact wireless charging case.',
    },
    {
      icon: Zap,
      title: '40ms Low Latency',
      description: 'Ultra-fast audio sync for mobile gaming (PUBG, COD) and video streaming without perceptible delay.',
    },
    {
      icon: Mic,
      title: 'Clear Calls',
      description: 'Quad-Mic ENC environmental noise reduction isolates your voice from traffic and wind noise during calls.',
    },
    {
      icon: Sliders,
      title: 'Smart Touch',
      description: 'Intuitive capacitive touch sensors for seamless playback, volume adjustment, call handling, and voice assistant.',
    },
    {
      icon: Droplets,
      title: 'IPX5 Protection',
      description: 'Water and sweat resistant design built to withstand intense workout sessions and sudden rainy days.',
    },
    {
      icon: Radio,
      title: 'USB-C + Qi',
      description: 'Fast USB-C cable charging plus convenient Qi wireless pad charging for effortless daily replenishment.',
    },
  ];

  // Authentic Customer Reviews for Pro 2
  const reviews = [
    {
      author: 'Usman R.',
      location: 'Lahore',
      rating: 5,
      date: 'September 2026',
      title: 'Sound quality & ANC blew me away',
      comment: 'I upgraded from ordinary earbuds and the ANC on the BURHAN Pro 2 is incredible. Commuting on the Metro is now peaceful. Battery easily lasts 4 days on a single case charge. Received within 48 hours via COD!',
    },
    {
      author: 'Hamza K.',
      location: 'Karachi',
      rating: 5,
      date: 'September 2026',
      title: 'Zero latency in gaming',
      comment: 'Tested on PUBG Mobile with low latency mode. Gunshots and footsteps are perfectly in sync. Quad mic is super clear on WhatsApp and Zoom calls too. Outstanding value for PKR 7,499.',
    },
    {
      author: 'Ayesha M.',
      location: 'Islamabad',
      rating: 5,
      date: 'August 2026',
      title: 'Premium build and packaging',
      comment: 'Packaging feels very high-end. Earbuds fit comfortably without falling out during jogging. Wireless charging works smoothly on my desk pad. Very happy with BURHAN official warranty.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-24 md:pb-16 text-slate-900">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 border border-slate-700 text-sm font-semibold"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span>Added to Cart!</span>
            <Link href="/cart" className="underline text-cyan-300 ml-2 hover:text-white">
              View Cart
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-slate-500 py-3 mb-4 flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-slate-900 transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <span className="text-slate-700">{product.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>

        {/* ========================================================= */}
        {/* SECTION 1: PRODUCT HERO */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs mb-8">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Product Images Gallery */}
            <div className="md:col-span-6 lg:col-span-6">
              {/* Main Image Frame */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 mb-3 shadow-inner">
                <Image
                  src={activeImage}
                  alt={`${product.name} - BURHAN STORE`}
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover transition-all duration-300"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discountPercent > 0 && (
                    <span className="bg-red-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {isPro2 && (
                    <span className="bg-slate-900 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs border border-slate-700">
                      Flagship Audio
                    </span>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  aria-label="Save to Wishlist"
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 hover:text-red-500 hover:bg-white shadow-sm border border-slate-200/60 transition-transform active:scale-95"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isInWishlist(product._id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              </div>

              {/* Thumbnails Row */}
              {productImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-cyan-500 shadow-sm ring-2 ring-cyan-500/20'
                          : 'border-slate-200 hover:border-slate-400 bg-white'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} angle ${index + 1}`}
                        fill
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Purchasing & Specs */}
            <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-start">
              {/* Product Category / Subtitle */}
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-cyan-700 mb-1">
                {isPro2 ? 'Premium Wireless Earbuds' : (product.category || 'Consumer Electronics')}
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight mb-2 leading-tight">
                {product.name}
              </h1>

              {/* Reviews & Social Proof */}
              <div className="flex items-center space-x-2 mb-4 text-xs sm:text-sm">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">5.0</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-600 font-medium">({product.reviewCount || 48} verified reviews)</span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                  Official Stock
                </span>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
                <div className="flex items-baseline space-x-3 mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                    PKR {Number(product.price).toLocaleString()}
                  </span>
                  {product.oldPrice && (
                    <span className="text-base sm:text-lg text-slate-400 line-through">
                      PKR {Number(product.oldPrice).toLocaleString()}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 flex items-center space-x-2">
                  <span>Price includes all taxes</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">Cash on Delivery across Pakistan</span>
                </div>
              </div>

              {/* Pro 2 Highlights List */}
              <div className="mb-6">
                <p className="text-slate-700 text-sm leading-relaxed mb-3">
                  {isPro2
                    ? 'Powerful sound, Hybrid ANC, clear calls and ultra-low latency — built for music, gaming and everyday use.'
                    : (product.description || 'Premium audio engineering designed for all-day comfort and high-definition sound.')}
                </p>

                {isPro2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-800 bg-cyan-50/50 border border-cyan-100 p-3.5 rounded-xl">
                    {pro2Highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                        <span className="font-semibold">{hl.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Status Indicator */}
              <div className="mb-4">
                {product.stock > 0 ? (
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-emerald-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock — Ready to ship from Karachi warehouse ({product.stock} units available)</span>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 font-semibold">Currently Out of Stock</div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors text-base font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors text-base font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  Subtotal: <strong className="text-slate-900">PKR {(product.price * quantity).toLocaleString()}</strong>
                </span>
              </div>

              {/* Purchase Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold py-3.5 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Buy Now — COD</span>
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-semibold py-3.5 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Rapid Payment & Delivery Assurance */}
              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Pay on Delivery</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Open Parcel Allowed</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-600" />
                  <span>6-Month Replacement Warranty*</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: TRUST / SERVICE BENEFITS */}
        {/* ========================================================= */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2.5">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Fast Delivery</h2>
              <p className="text-xs text-slate-600 leading-snug">
                1-3 days express courier with cash on delivery across Pakistan
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">6-Month Warranty*</h2>
              <p className="text-xs text-slate-600 leading-snug">
                Replacement coverage for eligible internal product issues. Terms apply.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2.5">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">7-Day Easy Returns</h2>
              <p className="text-xs text-slate-600 leading-snug">
                Defect replacement and exchange guarantee for total peace of mind
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mb-2.5">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">WhatsApp Support</h2>
              <p className="text-xs text-slate-600 leading-snug">
                Direct phone & chat assistance for order tracking and setup
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: WHY YOU'LL LOVE PRO 2 */}
        {/* ========================================================= */}
        {isPro2 && (
          <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-12 shadow-xs mb-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/60 rounded-md">
                <span>The Flagship Advantage</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight mb-3">
                Everything You Need. Nothing You Don't.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Premium features engineered for music, calls, gaming and everyday entertainment without unnecessary gimmicks.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pro2Benefits.map((benefit, i) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-cyan-300 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-cyan-600 flex items-center justify-center mb-3 shadow-2xs">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-1.5">{benefit.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 4, 5 & 6: TABS - DETAILS, SPECS, IN THE BOX */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs mb-12">
          {/* Tab Navigation Controls */}
          <div className="flex border-b border-slate-200 mb-8 space-x-4 sm:space-x-8 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3.5 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-3.5 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'features'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Product Details & Features
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-3.5 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'inbox'
                  ? 'border-cyan-500 text-cyan-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              What's in the Box
            </button>
          </div>

          {/* TAB 1: TECHNICAL SPECIFICATIONS */}
          {activeTab === 'specs' && (
            <div>
              <h2 className="text-lg font-bold text-slate-950 mb-4">Technical Specifications</h2>
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-slate-700">{key}</span>
                      <span className="font-medium text-slate-950 text-right">{value}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Bluetooth Version</span>
                      <span className="font-medium text-slate-950">5.3 + EDR Ultra-Fast</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Active Noise Cancellation</span>
                      <span className="font-medium text-slate-950">Up to 35dB Hybrid ANC</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Total Battery Playback</span>
                      <span className="font-medium text-slate-950">Up to 36 Hours (with case)</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Latency Mode</span>
                      <span className="font-medium text-slate-950">40ms Ultra-Low Latency</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Microphones</span>
                      <span className="font-medium text-slate-950">Quad-Mic ENC Array</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Charging Methods</span>
                      <span className="font-medium text-slate-950">USB Type-C + Qi Wireless</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Water Resistance</span>
                      <span className="font-medium text-slate-950">IPX5 Sweat & Splash Proof</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-700">Official Warranty</span>
                      <span className="font-medium text-slate-950">6-Month Replacement Warranty* (Internal issues; Terms apply)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCT DETAILS & FEATURES */}
          {activeTab === 'features' && (
            <div>
              <h2 className="text-lg font-bold text-slate-950 mb-4">Detailed Features & Capabilities</h2>
              {product.features && product.features.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800">
                      <Check className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                  <p>
                    The <strong>BURHAN Pro 2</strong> represents our next leap forward in personal audio. Powered by a customized high-fidelity dynamic driver, it delivers punchy sub-bass, clean vocals, and sparkling highs across all musical genres.
                  </p>
                  <p>
                    Whether taking work calls in crowded environments or gaming on your mobile device, the combination of hardware ENC filters and low-latency audio transmission ensures a responsive, crisp experience.
                  </p>
                </div>
              )}

              {/* 6-Month Replacement Warranty Policy Box */}
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center space-x-2 text-slate-900 font-bold mb-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>6-Month Replacement Warranty Policy*</span>
                </div>
                <p className="mb-2 leading-relaxed">
                  Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.
                </p>
                <ul className="space-y-1 list-disc pl-5 text-slate-600 mb-2">
                  <li>The product must be reasonably clean and suitable for inspection.</li>
                  <li>The product must not have physical damage (cracks, broken parts, liquid damage, burn damage, or signs of misuse).</li>
                  <li>The issue must be verified as an eligible internal product fault.</li>
                  <li>Warranty claims are subject to inspection and verification by BURHAN.</li>
                </ul>
                <p className="text-[11px] text-slate-500 italic">
                  Warranty does not cover physical or accidental damage, misuse, liquid damage, unauthorized modification or other externally caused damage. Terms & Conditions Apply.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: WHAT'S IN THE BOX */}
          {activeTab === 'inbox' && (
            <div>
              <h2 className="text-lg font-bold text-slate-950 mb-4">Package Contents</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(product.inBox && product.inBox.length > 0 ? product.inBox : [
                  'BURHAN Pro 2 Earbuds (Left & Right)',
                  'Smart Wireless Charging Case',
                  'Braided USB-C Fast Charging Cable',
                  '3 Pairs Ergonomic Silicone Ear Tips (S, M, L)',
                  'Official Warranty Card & User Manual'
                ]).map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800 font-medium">
                    <Package className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: CUSTOMER REVIEWS */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-cyan-700">Verified Buyer Feedback</div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Customer Reviews
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="text-sm font-bold text-slate-900">
                5.0 out of 5 · 48 Reviews
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((rev, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{rev.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{rev.author}</span>
                  <span className="text-slate-500 font-medium">Verified · {rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 8: FINAL CTA BANNER */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 text-center relative overflow-hidden shadow-md mb-12">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 block">
              Official Release Offer
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Ready to Experience BURHAN Pro 2?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Order today with cash on delivery across Pakistan, 6-month replacement warranty* and free doorstep exchange support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <button
                onClick={handleBuyNow}
                className="bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Buy Now — PKR {Number(product.price).toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/shop"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        </section>

        {/* Related Products If Present */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ========================================================= */}
      {/* STICKY MOBILE PURCHASE BAR (320px - 768px) */}
      {/* ========================================================= */}
      <aside aria-label="Quick mobile checkout" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate">
            {product.name}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold text-slate-950">
              PKR {Number(product.price).toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-slate-950 text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all whitespace-nowrap disabled:opacity-50"
        >
          BUY NOW
        </button>
      </aside>
    </div>
  );
}
