'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function Hero({ flagshipProduct, databaseUnavailable = false }) {
  const router = useRouter();
  const { cart, addToCart } = useCart();

  if (databaseUnavailable || !flagshipProduct) {
    return (
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">BURHAN STORE</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Store catalog temporarily unavailable
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            We are reconnecting the product catalog. Please try again shortly.
          </p>
        </div>
      </section>
    );
  }

  const product = flagshipProduct;

  const imageSrc = product.thumbnail || product.images?.[0] || '/images/burhan_pro2_earbuds.jpg';
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const isOutOfStock = (Number(product?.stock) || 0) <= 0;

  const handleInstantBuy = (e) => {
    e.preventDefault();
    if (product && !isOutOfStock) {
      const alreadyInCart = cart && cart.some(item => item._id === product._id);
      if (!alreadyInCart) {
        addToCart(product, 1);
      }
      router.push('/checkout');
    }
  };

  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden bg-[#0B0D10] text-white border-b border-white/10">
      {/* Studio Ambient Light Reveal */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] bg-radial from-[#B9A47C]/12 via-white/5 to-transparent rounded-full blur-[130px] pointer-events-none"
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-[90px] pointer-events-none"
      />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Brand Kicker */}
            <div className="inline-flex items-center space-x-2 text-[#B9A47C] text-xs font-semibold tracking-wider uppercase mb-5 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B9A47C]" />
              <span>Official Flagship Release</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-5 leading-[1.08]">
              Sound that moves with you.
            </h1>

            {/* Subheading / Truthful Value Proposition */}
            <p className="text-base sm:text-lg text-white/70 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Explore wireless audio for your everyday routine. Order with Cash on Delivery and contact BURHAN STORE directly for product and delivery questions.
            </p>

            {/* Dynamic CTA Group */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-10">
              <Link
                href={`/shop/${product.slug}`}
                className="bg-white hover:bg-neutral-100 active:scale-98 text-[#0B0D10] font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-white/10 hover:shadow-white/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Discover {product.name}</span>
                <ArrowRight className="w-4 h-4 text-[#0B0D10]" />
              </Link>

              <button
                type="button"
                onClick={handleInstantBuy}
                disabled={isOutOfStock}
                className={`bg-[#171A20] hover:bg-[#232730] active:scale-98 text-white border border-white/15 font-semibold px-6 py-4 rounded-xl text-base transition-colors flex items-center justify-center space-x-2 backdrop-blur-sm ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#B9A47C]" />
                <span>{isOutOfStock ? 'Sold Out' : 'Quick Buy (COD)'}</span>
              </button>
            </div>

            {/* Verified Trust Micro-Signals */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center space-x-2 text-white/80">
                <Truck className="w-4 h-4 text-[#B9A47C] shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Nationwide COD</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <ShieldCheck className="w-4 h-4 text-[#B9A47C] shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Store Support</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle2 className="w-4 h-4 text-[#B9A47C] shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Order Support</span>
              </div>
            </div>
          </motion.div>

          {/* Right Product Showcase Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-5 relative mt-4 lg:mt-0"
          >
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Product Visual Container with Quiet Luxury Frame */}
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#171A20] shadow-2xl border border-white/10 p-3 sm:p-4 group">
                <Link href={`/shop/${product.slug}`} className="block relative w-full h-full rounded-2xl overflow-hidden bg-[#0B0D10]">
                  <Image
                    src={imageSrc}
                    alt={`${product.name} - BURHAN STORE`}
                    fill
                    priority
                    referrerPolicy="no-referrer"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

                {/* Overlaid Dynamic Live Price Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#0B0D10]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-[#B9A47C] uppercase tracking-wider">
                      Flagship Audio Release
                    </div>
                    <div className="text-base sm:text-lg font-extrabold text-white">
                      {product.name}
                    </div>
                  </div>

                  <div className="text-right">
                    {hasDiscount && (
                      <div className="text-xs text-white/40 line-through">
                        PKR {Number(product.oldPrice).toLocaleString()}
                      </div>
                    )}
                    <div className="text-base sm:text-lg font-extrabold text-[#F4F2ED]">
                      PKR {Number(product.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Discount Tag */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-[#B9A47C] text-[#0B0D10] text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
