'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';
import { calculateValidDiscount } from '@/lib/utils/pricing';

export default function FeaturedProduct({ initialProduct = null }) {
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialProduct) {
      fetch(`/api/products/featured?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : { products: [] }))
        .then(data => {
          const prods = data?.products || [];
          const feat = prods[0] || null;
          if (feat) setProduct(feat);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load featured product:', err);
          setLoading(false);
        });
    } else {
      setProduct(initialProduct);
      setLoading(false);
    }
  }, [initialProduct]);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-[#F4F2ED] border-b border-[#E2DDD5]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center animate-pulse">
            <div className="aspect-square bg-[#EAE6DF] rounded-3xl" />
            <div className="space-y-4">
              <div className="h-4 bg-[#EAE6DF] rounded w-28" />
              <div className="h-10 bg-[#EAE6DF] rounded w-3/4" />
              <div className="h-6 bg-[#EAE6DF] rounded w-1/3" />
              <div className="h-20 bg-[#EAE6DF] rounded" />
              <div className="h-12 bg-[#EAE6DF] rounded w-1/2" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!product) return null;
  const displayProduct = product;
  const imageSrc = displayProduct.thumbnail || displayProduct.images?.[0] || '/images/burhan_pro2_earbuds.jpg';
  const discountPercent = calculateValidDiscount(displayProduct.price, displayProduct.oldPrice);
  const hasDiscount = discountPercent > 0;

  const isOutOfStock = (Number(displayProduct.stock) || 0) <= 0;

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const alreadyInCart = cart && cart.some(item => item._id === displayProduct._id);
    if (!alreadyInCart) {
      addToCart(displayProduct, 1);
      gaAddToCart(displayProduct, 1);
    }
    router.push('/checkout');
  };

  const keyBenefits = [
    { text: 'Cash on Delivery available' },
    { text: 'Clear delivery charges at checkout' },
    { text: 'Direct WhatsApp support for product and order questions' },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F4F2ED] border-b border-[#E2DDD5]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center md:text-left mb-8 md:mb-12">
          <div className="inline-flex items-center space-x-2 text-[#8E7B56] text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-white border border-[#E2DDD5] rounded-full">
            <span>Flagship Release</span>
            <span aria-hidden="true">·</span>
            <span>Wireless Audio</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight">
            Meet the {displayProduct.name}
          </h2>
          <p className="text-[#5A606A] text-base sm:text-lg max-w-2xl mt-1 leading-relaxed">
            Explore the product details, check the available options, and ask us anything before you order.
          </p>
        </div>

        {/* Featured Card */}
        <div className="bg-white border border-[#E2DDD5] rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm">
          <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Product Image Column */}
            <div className="md:col-span-6 lg:col-span-5">
              <Link href={`/shop/${displayProduct.slug}`} className="block group">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#F4F2ED] shadow-sm border border-[#E2DDD5] p-3 sm:p-4">
                  <Image
                    src={imageSrc}
                    alt={`${displayProduct.name} - BURHAN STORE`}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-4 left-4 bg-[#B9A47C] text-[#0B0D10] text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {discountPercent}% OFF
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Product Details Column */}
            <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center space-x-2 mb-2 text-xs">
                <span className="font-bold text-[#8E7B56] bg-[#F4F2ED] border border-[#E2DDD5] px-2.5 py-0.5 rounded-full">
                  Official Store Device
                </span>
                <span className="text-[#A09D96]">·</span>
                <span className="text-[#5A606A] font-medium">Direct Store Support</span>
              </div>

              <div className="text-xs uppercase tracking-wider font-bold text-[#8E7B56] mb-1">
                {displayProduct.category || 'Wireless Earbuds'}
              </div>

              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#171A20] mb-3 tracking-tight">
                <Link href={`/shop/${displayProduct.slug}`} className="hover:text-[#B9A47C] transition-colors">
                  {displayProduct.name}
                </Link>
              </h3>

              {/* Price Row */}
              <div className="flex items-baseline space-x-3 mb-4">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight">
                  PKR {Number(displayProduct.price).toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-[#A09D96] line-through">
                    PKR {Number(displayProduct.oldPrice).toLocaleString()}
                  </span>
                )}
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Out of Stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    In Stock ({displayProduct.stock} units)
                  </span>
                )}
              </div>

              <p className="text-[#5A606A] text-sm sm:text-base leading-relaxed mb-6">
                {displayProduct.shortDescription || displayProduct.description || 'Dynamic acoustic drivers, Active Noise Cancellation, and extended playtime for your everyday digital audio experience.'}
              </p>

              {/* Key Benefits Grid */}
              <div className="grid sm:grid-cols-2 gap-2.5 mb-8">
                {keyBenefits.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs sm:text-sm text-[#171A20]">
                    <Check className="w-4 h-4 text-[#8E7B56] shrink-0" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className={`px-8 py-3.5 rounded-xl text-base font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                    isOutOfStock
                      ? 'bg-[#EAE6DF] text-[#A09D96] cursor-not-allowed'
                      : 'bg-[#171A20] hover:bg-[#0B0D10] active:scale-98 text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-[#B9A47C]" />
                  <span>
                    {isOutOfStock ? 'Sold Out' : `Buy Now — PKR ${Number(displayProduct.price).toLocaleString()}`}
                  </span>
                </button>
                <Link
                  href={`/shop/${displayProduct.slug}`}
                  className="bg-white hover:bg-[#F4F2ED] active:scale-98 text-[#171A20] border border-[#D6D1C7] font-semibold px-6 py-3.5 rounded-xl text-base transition-colors flex items-center justify-center space-x-2 shadow-2xs"
                >
                  <span>Full Specifications</span>
                  <ArrowRight className="w-4 h-4 text-[#5A606A]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
