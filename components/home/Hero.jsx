'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Truck, Headphones, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const [featuredProduct, setFeaturedProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/featured?limit=1&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { products: [] }))
      .then(data => {
        const prods = data?.products || [];
        if (prods.length > 0) {
          setFeaturedProduct(prods[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative pt-24 md:pt-32 pb-14 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Clean Sub-header / Brand Tag */}
            <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs md:text-sm font-bold uppercase tracking-wider mb-4 px-3.5 py-1.5 bg-cyan-50 border border-cyan-200/70 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Official BURHAN STORE Pakistan</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 mb-5 tracking-tight leading-[1.12]">
              Powering Your{' '}
              <span className="text-cyan-600">
                Digital Lifestyle.
              </span>
            </h1>

            {/* Subheading / Value Proposition */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Premium audio, smart wearables, and mobile tech accessories — built for reliability, pure sound clarity, and backed by nationwide cash on delivery across Pakistan.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-8">
              {featuredProduct ? (
                <Link
                  href={`/shop/${featuredProduct.slug}`}
                  className="bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Discover {featuredProduct.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/shop"
                  className="bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/shop"
                className="bg-white hover:bg-slate-50 active:scale-98 text-slate-800 border border-slate-300 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors flex items-center justify-center shadow-2xs"
              >
                Browse All Products
              </Link>
            </div>

            {/* Trust Micro-signals */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center space-x-2 text-slate-700">
                <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">Nationwide COD</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">6-Month Warranty*</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Headphones className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">Official Support</span>
              </div>
            </div>
          </motion.div>

          {/* Right Product Showcase Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 relative mt-4 lg:mt-0"
          >
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Product Visual Container */}
              <div className="relative aspect-square w-full rounded-2xl md:rounded-3xl overflow-hidden bg-white shadow-xl border border-slate-200/80 p-3 sm:p-4">
                <Image
                  src="https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800"
                  alt="BURHAN Pro 2 Wireless Earbuds"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover rounded-xl md:rounded-2xl"
                />

                {/* Overlaid Micro-Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">Featured Release</div>
                    <div className="text-base font-extrabold text-slate-900">BURHAN Pro 2</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 line-through">PKR 9,999</div>
                    <div className="text-base font-extrabold text-slate-950">PKR 7,499</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
