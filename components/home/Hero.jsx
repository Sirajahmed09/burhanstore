'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function Hero({ flagshipProduct }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const product = flagshipProduct || {
    _id: 'burhan-pro-2-flagship',
    name: 'BURHAN Pro 2',
    slug: 'burhan-pro-2',
    price: 7499,
    oldPrice: 9999,
    thumbnail: '/images/burhan_pro2_earbuds.jpg',
    images: ['/images/burhan_pro2_earbuds.jpg']
  };

  const imageSrc = product.thumbnail || product.images?.[0] || '/images/burhan_pro2_earbuds.jpg';
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleInstantBuy = (e) => {
    e.preventDefault();
    if (product) {
      addToCart(product, 1);
      router.push('/cart');
    }
  };

  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden bg-slate-950 text-white border-b border-slate-800">
      {/* Subtle Ambient Lighting Effects */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"
      />
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-slate-800/40 rounded-full blur-[100px] pointer-events-none"
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
            <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs md:text-sm font-semibold tracking-wider uppercase mb-5 px-3.5 py-1.5 bg-cyan-950/70 border border-cyan-800/60 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official BURHAN STORE Pakistan</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-5 leading-[1.1]">
              Pure Acoustic Clarity.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
                Engineered for Pakistan.
              </span>
            </h1>

            {/* Subheading / Value Proposition */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              High-definition audio, Active Noise Cancellation, and low-latency performance. Backed by nationwide Cash on Delivery with open parcel inspection and 6 months store warranty.
            </p>

            {/* Dynamic CTA Group */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-10">
              <Link
                href={`/shop/${product.slug}`}
                className="bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>Discover {product.name}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleInstantBuy}
                className="bg-slate-900/90 hover:bg-slate-800 active:scale-98 text-white border border-slate-700/80 font-semibold px-6 py-4 rounded-xl text-base transition-colors flex items-center justify-center space-x-2 backdrop-blur-sm"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>Quick Buy (COD)</span>
              </button>
            </div>

            {/* Verified Trust Micro-Signals */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center space-x-2 text-slate-300">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Nationwide COD</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">6-Month Warranty*</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Open Parcel Allowed</span>
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
              {/* Product Visual Container with Ambient Border Glow */}
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-900/90 shadow-2xl border border-slate-800 p-3 sm:p-4 group">
                <Link href={`/shop/${product.slug}`} className="block relative w-full h-full rounded-2xl overflow-hidden">
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
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      Flagship Audio Release
                    </div>
                    <div className="text-base sm:text-lg font-extrabold text-white">
                      {product.name}
                    </div>
                  </div>

                  <div className="text-right">
                    {hasDiscount && (
                      <div className="text-xs text-slate-400 line-through">
                        PKR {Number(product.oldPrice).toLocaleString()}
                      </div>
                    )}
                    <div className="text-base sm:text-lg font-extrabold text-cyan-300">
                      PKR {Number(product.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Discount Tag */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
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
