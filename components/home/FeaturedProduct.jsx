'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ShoppingBag, ShieldCheck, Zap, BatteryCharging, Radio, Volume2, Mic } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

export default function FeaturedProduct() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?limit=1&sort=newest&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { products: [] }))
      .then(data => {
        const prods = data?.products || [];
        const feat = prods.find(p => p.slug === 'burhan-pro-2') || prods[0] || null;
        setProduct(feat);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load featured product:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center animate-pulse">
            <div className="aspect-square bg-slate-100 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-28" />
              <div className="h-10 bg-slate-100 rounded w-3/4" />
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-20 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) return null;

  const imageSrc = product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800';

  const handleBuyNow = () => {
    addToCart(product, 1);
    gaAddToCart(product, 1);
    router.push('/cart');
  };

  const keyBenefits = [
    { text: 'Up to 35dB Hybrid Active Noise Cancellation' },
    { text: 'Up to 36 Hours Total Battery Playback with Case' },
    { text: '40ms Ultra-Low Latency for Gaming & Media' },
    { text: 'Bluetooth 5.3 + EDR with Quad-Mic ENC Array' },
    { text: 'Fast USB-C + Qi Wireless Charging Compatibility' },
    { text: 'Official 1-Year Replacement Warranty' },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center md:text-left mb-8 md:mb-12">
          <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
            <span>Flagship Release</span>
            <span aria-hidden="true">·</span>
            <span>Official Audio</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Meet the BURHAN Pro 2
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mt-1 leading-relaxed">
            Powerful sound, Hybrid ANC, clear calls and ultra-low latency — built for music, gaming and everyday use.
          </p>
        </div>

        {/* Featured Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 md:p-12 shadow-xs">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Product Image Column */}
            <div className="md:col-span-6 lg:col-span-5">
              <Link href={`/shop/${product.slug}`} className="block group">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-md border border-slate-200/80 p-3 sm:p-4">
                  <Image
                    src={imageSrc}
                    alt={`${product.name} - BURHAN STORE`}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider shadow-2xs">
                    25% OFF
                  </div>
                </div>
              </Link>
            </div>

            {/* Product Details Column */}
            <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-2 text-sm">
                <div className="flex text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <span className="font-bold text-slate-900">5.0</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-600 font-medium">({product.reviewCount || 48} verified reviews)</span>
              </div>

              <div className="text-xs uppercase tracking-wider font-bold text-cyan-700 mb-1">
                Premium Wireless Earbuds
              </div>

              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 mb-3 tracking-tight">
                <Link href={`/shop/${product.slug}`} className="hover:text-cyan-700 transition-colors">
                  {product.name}
                </Link>
              </h3>

              {/* Price Row */}
              <div className="flex items-baseline space-x-3 mb-4">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  PKR {Number(product.price).toLocaleString()}
                </span>
                {product.oldPrice && (
                  <span className="text-lg text-slate-400 line-through">
                    PKR {Number(product.oldPrice).toLocaleString()}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  In Stock
                </span>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Everything You Need. Nothing You Don't. Premium audio features for music, crystal-clear voice calls, competitive gaming, and everyday lifestyle entertainment.
              </p>

              {/* Key Benefits Grid */}
              <div className="grid sm:grid-cols-2 gap-2 mb-8">
                {keyBenefits.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs sm:text-sm text-slate-800">
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBuyNow}
                  className="bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now — PKR {Number(product.price).toLocaleString()}</span>
                </button>
                <Link
                  href={`/shop/${product.slug}`}
                  className="bg-white hover:bg-slate-100 active:scale-98 text-slate-800 border border-slate-300 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors flex items-center justify-center space-x-2 shadow-2xs"
                >
                  <span>Explore Features</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Micro-signals */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 text-xs text-slate-500 flex flex-wrap items-center gap-4">
                <span>✓ Cash on Delivery</span>
                <span>✓ 1-Year Official Warranty</span>
                <span>✓ Open Parcel Allowed</span>
                <span>✓ 7-Day Easy Replacement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
