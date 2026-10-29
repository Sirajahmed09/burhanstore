'use client';

import { useRouter } from 'next/navigation';
import { getColourVariants, colourPriceRange } from '@/lib/commerce/colourVariants';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';
import { calculateValidDiscount } from '@/lib/utils/pricing';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = (Number(product?.stock) || 0) <= 0;
  const imageSrc = product?.thumbnail || product?.images?.[0] || product?.image || '/images/burhan_pro2_earbuds.jpg';

  const hasColours = getColourVariants(product).length > 0;
  const priceRange = colourPriceRange(product);
  const discountPercent = hasColours ? 0 : calculateValidDiscount(product.price, product.oldPrice);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasColours) { router.push(`/shop/${product.slug}`); return; }
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
    <div className="group h-full flex flex-col bg-white rounded-2xl border border-[#E2DDD5] hover:border-[#D6D1C7] shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden relative">
      {/* Product Image Frame */}
      <div className="relative aspect-square w-full bg-[#F4F2ED] overflow-hidden">
        <Link
          href={`/shop/${product.slug}`}
          className="block relative w-full h-full focus:outline-none focus:ring-2 focus:ring-[#B9A47C] rounded-t-2xl"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={imageSrc}
            alt={`${product.name || 'Product'} - BURHAN STORE`}
            fill
            referrerPolicy="no-referrer"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-[#171A20]/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs">
              Out of Stock
            </span>
          ) : (
            <>
              {discountPercent > 0 && (
                <span className="bg-[#B9A47C] text-[#0B0D10] text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                  {discountPercent}% OFF
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-[#171A20] text-[#B9A47C] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                  Flagship
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Button - Sibling Control */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#171A20] hover:text-red-500 hover:bg-white shadow-2xs border border-[#E2DDD5] transition-transform active:scale-90 z-20 focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
        >
          <Heart
            className={`w-4 h-4 ${
              isInWishlist(product._id)
                ? 'fill-red-500 text-red-500'
                : 'text-[#171A20]'
            }`}
          />
        </button>
      </div>

      {/* Product Details & Actions */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Category / Brand kicker */}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8E7B56] mb-1">
            {product.category || 'Official Store'}
          </div>

          {/* Product Title Link */}
          <h3 className="font-heading text-sm sm:text-base font-bold text-[#171A20] leading-snug mb-2">
            <Link
              href={`/shop/${product.slug}`}
              className="hover:text-[#8E7B56] transition-colors line-clamp-2 block focus:outline-none focus:underline"
            >
              {product.name}
            </Link>
          </h3>

          {/* Real Rating if available */}
          {product.rating > 0 ? (
            <div className="flex items-center space-x-1.5 mb-2.5 text-xs">
              <div className="flex text-[#B9A47C]">
                <Star className="w-3.5 h-3.5 fill-[#B9A47C] text-[#B9A47C]" />
              </div>
              <span className="font-bold text-[#171A20]">{product.rating}</span>
              {product.reviewCount > 0 && (
                <span className="text-[#5A606A]">({product.reviewCount})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 mb-2.5 text-xs text-[#5A606A]">
              <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                BURHAN STORE
              </span>
            </div>
          )}

          {/* Price Row */}
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-lg sm:text-xl font-extrabold text-[#171A20] tracking-tight">
              {priceRange.high > priceRange.low ? 'From ' : ''}PKR {priceRange.low.toLocaleString()}
            </span>
            {!hasColours && product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-[#A09D96] line-through">
                PKR {Number(product.oldPrice).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action CTA Button - Sibling Control */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#B9A47C] ${
              isOutOfStock
                ? 'bg-[#EAE6DF] text-[#A09D96] cursor-not-allowed border border-[#D6D1C7]'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#171A20] hover:bg-[#0B0D10] text-white shadow-xs'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-[#B9A47C]" />
                <span>{isOutOfStock ? 'Out of Stock' : hasColours ? 'Choose Colour' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
