'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = (Number(product?.stock) || 0) <= 0;
  const imageSrc = product?.thumbnail || product?.images?.[0] || product?.image || 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800';

  const discountPercent = product.discount || (product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    gaAddToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
      <Link href={`/shop/${product.slug}`} className="flex flex-col h-full">
        {/* Product Image Frame */}
        <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
          <Image
            src={imageSrc}
            alt={`${product.name || 'Product'} - BURHAN STORE`}
            fill
            referrerPolicy="no-referrer"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
          />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {isOutOfStock ? (
              <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                Out of Stock
              </span>
            ) : (
              <>
                {discountPercent > 0 && (
                  <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-slate-900 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                    Flagship
                  </span>
                )}
              </>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label="Toggle Wishlist"
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white shadow-2xs border border-slate-200/60 transition-transform active:scale-90 z-10"
          >
            <Heart
              className={`w-4 h-4 ${
                isInWishlist(product._id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* Category / Brand kicker */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700 mb-1">
              {product.category || 'Official Store'}
            </div>

            {/* Product Title */}
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 leading-snug mb-2">
              {product.name}
            </h3>

            {/* Real Rating if available */}
            {product.rating > 0 ? (
              <div className="flex items-center space-x-1.5 mb-2.5 text-xs">
                <div className="flex text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="font-bold text-slate-900">{product.rating}</span>
                {product.reviewCount > 0 && (
                  <span className="text-slate-500">({product.reviewCount})</span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 mb-2.5 text-xs text-slate-500">
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                  Authentic Brand
                </span>
              </div>
            )}

            {/* Price Row */}
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                PKR {Number(product.price).toLocaleString()}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  PKR {Number(product.oldPrice).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-98 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-xs'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </Link>
    </div>
  );
}
