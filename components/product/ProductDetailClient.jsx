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
  Clock,
  ChevronDown,
  HelpCircle,
  MessageSquarePlus,
  Send
} from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import ProductCard from '@/components/product/ProductCard';
import { trackViewItem, trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

// Icon dictionary for dynamic feature cards
const ICON_MAP = {
  Volume2,
  BatteryCharging,
  Zap,
  Mic,
  Sliders,
  Droplets,
  Radio,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  RotateCcw,
  Clock
};

function getFeatureIcon(iconKey) {
  if (iconKey && ICON_MAP[iconKey]) {
    return ICON_MAP[iconKey];
  }
  return Sparkles;
}

export default function ProductDetailClient({ product, initialRelated = [] }) {
  const router = useRouter();
  const [relatedProducts, setRelatedProducts] = useState(initialRelated);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [addedToast, setAddedToast] = useState(false);
  
  // Real Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    name: '',
    rating: 5,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState('');

  // FAQ Accordion State (all open by default or index 0 open)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Load related products & real reviews
  useEffect(() => {
    if (product) {
      trackViewItem(product);
      
      // Load related products if needed
      if (initialRelated.length === 0 && product.slug) {
        fetch(`/api/products/${product.slug}/related?_t=${Date.now()}`, { cache: 'no-store' })
          .then(res => (res.ok ? res.json() : { products: [] }))
          .then(relData => {
            setRelatedProducts(relData.products || []);
          })
          .catch(err => console.error('Failed to load related products:', err));
      }

      // Load real customer reviews
      const targetId = product._id || product.slug;
      fetch(`/api/reviews/${targetId}?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : { reviews: [] }))
        .then(data => {
          setReviews(data?.reviews || []);
          setReviewsLoading(false);
        })
        .catch(err => {
          console.error('Failed to load reviews:', err);
          setReviewsLoading(false);
        });
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewFormData.name.trim() || !reviewFormData.comment.trim()) return;

    setReviewSubmitting(true);
    setReviewSubmitMessage('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          productSlug: product.slug,
          name: reviewFormData.name.trim(),
          rating: Number(reviewFormData.rating) || 5,
          comment: reviewFormData.comment.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSubmitMessage('Thank you! Your review has been submitted for moderation.');
        setReviewFormData({ name: '', rating: 5, comment: '' });
        setTimeout(() => setShowReviewForm(false), 3000);
      } else {
        setReviewSubmitMessage(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewSubmitMessage('Error submitting review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!product) {
    return null;
  }

  // Dynamic Product Images
  const productImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.thumbnail ? [product.thumbnail] : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800']));
  const activeImage = productImages[selectedImage] || productImages[0];

  // Dynamic Pricing & Discount Calculation
  const price = Number(product.price) || 0;
  const oldPrice = Number(product.oldPrice) || 0;
  const discountPercent = product.discount || (oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0);

  // Dynamic Badge
  const badgeText = product.badge || (product.isFeatured ? 'Flagship Audio' : (product.isNew ? 'New Release' : ''));

  // Dynamic Highlights List
  const highlights = Array.isArray(product.highlights) && product.highlights.length > 0
    ? product.highlights
    : (Array.isArray(product.features) && product.features.length > 0
      ? product.features.map(f => typeof f === 'string' ? f : f.title).slice(0, 6)
      : []);

  // Dynamic Feature Cards
  const featureCards = Array.isArray(product.features) && product.features.length > 0
    ? product.features.map(f => {
        if (typeof f === 'string') {
          return { title: f, description: '', icon: 'Sparkles' };
        }
        return f;
      })
    : [];

  // Dynamic Specifications
  const specifications = product.specifications && typeof product.specifications === 'object'
    ? (Array.isArray(product.specifications)
        ? product.specifications
        : Object.entries(product.specifications).map(([key, value]) => ({ key, value })))
    : [];

  // Dynamic What's in the Box
  const inBoxItems = Array.isArray(product.inBox) && product.inBox.length > 0
    ? product.inBox
    : [];

  // Dynamic FAQs
  const faqs = Array.isArray(product.faqs) && product.faqs.length > 0
    ? product.faqs
    : [];

  // Dynamic Warranty
  const warrantyObj = typeof product.warranty === 'object' && product.warranty !== null
    ? product.warranty
    : {
        duration: '6 Months',
        type: 'Replacement Warranty',
        description: typeof product.warranty === 'string' && product.warranty ? product.warranty : 'Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.',
        terms: [
          'The product must be reasonably clean and suitable for inspection.',
          'The product must not have physical damage (cracks, broken parts, liquid damage, burn damage, or signs of misuse).',
          'The issue must be verified as an eligible internal product fault.',
          'Warranty claims are subject to inspection and verification by BURHAN.',
          'Warranty does not cover physical or accidental damage, misuse, liquid damage, unauthorized modification or other externally caused damage.'
        ]
      };

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
                  {badgeText && (
                    <span className="bg-slate-900 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs border border-slate-700">
                      {badgeText}
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
                        alt={`${product.name} view ${index + 1}`}
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
                {product.category || 'Official Consumer Electronics'}
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight mb-2 leading-tight">
                {product.name}
              </h1>

              {/* Real Ratings & Authenticity Tag */}
              <div className="flex items-center space-x-2 mb-4 text-xs sm:text-sm">
                {reviews.length > 0 ? (
                  <>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900">
                      {(reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-600 font-medium">({reviews.length} verified review{reviews.length !== 1 ? 's' : ''})</span>
                    <span className="text-slate-500">·</span>
                  </>
                ) : null}
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs">
                  Official Stock
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-800 font-medium text-xs">
                  Cash on Delivery
                </span>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
                <div className="flex items-baseline space-x-3 mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                    PKR {price.toLocaleString()}
                  </span>
                  {oldPrice > price && (
                    <span className="text-base sm:text-lg text-slate-400 line-through">
                      PKR {oldPrice.toLocaleString()}
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

              {/* Short Description & Highlights */}
              <div className="mb-6">
                <p className="text-slate-700 text-sm leading-relaxed mb-3">
                  {product.shortDescription || product.description || 'Premium technology engineering designed for everyday performance, durability, and all-day convenience.'}
                </p>

                {highlights.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-800 bg-cyan-50/50 border border-cyan-100 p-3.5 rounded-xl">
                    {highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                        <span className="font-semibold">{hl}</span>
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
                  Subtotal: <strong className="text-slate-900">PKR {(price * quantity).toLocaleString()}</strong>
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
              <h2 className="text-sm font-bold text-slate-900 mb-1">Open Parcel Check</h2>
              <p className="text-xs text-slate-600 leading-snug">
                Verify package contents on doorstep delivery before making payment
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
        {/* SECTION 3: KEY FEATURES GRID (DYNAMIC FROM PRODUCT DATA) */}
        {/* ========================================================= */}
        {featureCards.length > 0 && (
          <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-12 shadow-xs mb-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/60 rounded-md">
                <span>Key Capabilities</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight mb-3">
                Everything You Need. Nothing You Don't.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Carefully engineered features built for daily reliability, long battery timing, and premium audio performance.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((benefit, i) => {
                const IconComponent = getFeatureIcon(benefit.icon);
                return (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-cyan-300 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-cyan-600 flex items-center justify-center mb-3 shadow-2xs">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-950 mb-1.5">{benefit.title}</h3>
                    {benefit.description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    )}
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
              Product Details & Warranty
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
              {specifications.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  {specifications.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-slate-700">{item.key}</span>
                      <span className="font-medium text-slate-950 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Specifications available upon request or in manual.</p>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT DETAILS & WARRANTY */}
          {activeTab === 'features' && (
            <div>
              <h2 className="text-lg font-bold text-slate-950 mb-3">Product Overview</h2>
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed mb-6">
                <p>{product.description || product.shortDescription}</p>
              </div>

              {/* 6-Month Replacement Warranty Policy Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center space-x-2 text-slate-900 font-bold mb-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>{warrantyObj.duration || '6 Months'} {warrantyObj.type || 'Replacement Warranty'} Policy*</span>
                </div>
                <p className="mb-2 leading-relaxed">
                  {warrantyObj.description || 'Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.'}
                </p>
                {Array.isArray(warrantyObj.terms) && warrantyObj.terms.length > 0 && (
                  <ul className="space-y-1 list-disc pl-5 text-slate-600 mb-2">
                    {warrantyObj.terms.map((term, tIdx) => (
                      <li key={tIdx}>{term}</li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-slate-500 italic">
                  Warranty claims are subject to inspection and verification by BURHAN. Coverage does not apply to physical or accidental drops, liquid damage, misuse, or unauthorized tampering. Terms & Conditions Apply.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: WHAT'S IN THE BOX */}
          {activeTab === 'inbox' && (
            <div>
              <h2 className="text-lg font-bold text-slate-950 mb-4">Package Contents</h2>
              {inBoxItems.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {inBoxItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800 font-medium">
                      <Package className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800 font-medium">
                    <Package className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>{product.name} Official Unit</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs sm:text-sm text-slate-800 font-medium">
                    <Package className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Official Warranty Card & User Documentation</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: FREQUENTLY ASKED QUESTIONS (DYNAMIC) */}
        {/* ========================================================= */}
        {faqs.length > 0 && (
          <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs mb-12">
            <div className="max-w-2xl mb-8">
              <div className="text-xs uppercase tracking-wider font-semibold text-cyan-700 mb-1">
                Frequently Asked Questions
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, fIdx) => {
                const isOpen = openFaqIndex === fIdx;
                return (
                  <div
                    key={fIdx}
                    className="border border-slate-200/80 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : fIdx)}
                      className="w-full px-5 py-4 text-left font-bold text-sm sm:text-base text-slate-900 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center space-x-2.5">
                        <HelpCircle className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-cyan-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-200/60">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 8: REAL CUSTOMER REVIEWS & FORM */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-xs mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-cyan-700">Customer Feedback & Reviews</div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Customer Reviews
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
              </button>
            </div>
          </div>

          {/* Inline Review Form */}
          {showReviewForm && (
            <form onSubmit={handleReviewSubmit} className="mb-8 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Share your experience with {product.name}</h3>
              {reviewSubmitMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  reviewSubmitMessage.includes('Thank you') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}>
                  {reviewSubmitMessage}
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewFormData.name}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                    placeholder="e.g. Usman Khan"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating *</label>
                  <select
                    value={reviewFormData.rating}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3 - Good)</option>
                    <option value={2}>⭐⭐ (2 - Fair)</option>
                    <option value={1}>⭐ (1 - Poor)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewFormData.comment}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                  placeholder="Share details about sound quality, battery timing, packaging, or delivery..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</span>
              </button>
            </form>
          )}

          {/* Reviews List or Honest Clean Empty State */}
          {reviewsLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((rev, i) => (
                <div key={rev._id || i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating || 5)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : 'Verified'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                      "{rev.comment}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{rev.name}</span>
                    {rev.verified ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        Verified Buyer
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Customer Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">No reviews yet</h3>
              <p className="text-xs text-slate-500 mb-4">
                Be the first verified customer to share feedback about {product.name}.
              </p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg shadow-2xs transition-colors"
              >
                Write the First Review
              </button>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 9: FINAL CTA BANNER */}
        {/* ========================================================= */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 text-center relative overflow-hidden shadow-md mb-12">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 block">
              Official Pakistani Release
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Ready to Order {product.name}?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Order today with cash on delivery across Pakistan, 6-month replacement warranty* and free doorstep exchange support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <button
                onClick={handleBuyNow}
                className="bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Buy Now — PKR {price.toLocaleString()}</span>
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
              PKR {price.toLocaleString()}
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
