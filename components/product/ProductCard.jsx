'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { trackAddToCart as gaAddToCart } from '@/lib/analytics/gtag';

export default function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isOutOfStock = (Number(product?.stock) || 0) <= 0;
  const imageSrc = product?.thumbnail || product?.images?.[0] || product?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product);
    gaAddToCart(product, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/shop/${product.slug}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 card-glow">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            <Image
              src={imageSrc}
              alt={`${product.name || 'Product'} - BURHAN STORE`}
              fill
              referrerPolicy="no-referrer"
              className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {isOutOfStock ? (
                <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  OUT OF STOCK
                </span>
              ) : (
                <>
                  {product.isNew && (
                    <span className="bg-burhan-success text-white text-xs font-semibold px-3 py-1 rounded-full">
                      NEW
                    </span>
                  )}
                  {product.discount > 0 && (
                    <span className="bg-burhan-error text-white text-xs font-semibold px-3 py-1 rounded-full">
                      -{product.discount}%
                    </span>
                  )}
                  {product.isTrending && (
                    <span className="bg-burhan-warning text-white text-xs font-semibold px-3 py-1 rounded-full">
                      TRENDING
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <Heart
                className={`w-5 h-5 ${
                  isInWishlist(product._id)
                    ? 'fill-burhan-error text-burhan-error'
                    : 'text-gray-400'
                }`}
              />
            </button>

            {/* Quick Add Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              className="absolute bottom-3 left-3 right-3"
            >
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-burhan-primary text-white hover:bg-burhan-secondary ripple'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-5">
            {/* Rating */}
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-burhan-warning text-burhan-warning'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-burhan-text-secondary">
                ({product.reviewCount})
              </span>
            </div>

            {/* Product Name */}
            <h3 className="font-semibold text-burhan-text-primary mb-2 line-clamp-2 group-hover:text-burhan-secondary transition-colors">
              {product.name}
            </h3>

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-burhan-primary">
                PKR {product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-gray-400 line-through">
                  PKR {product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {product.stock > 0 ? (
              <div className="mt-2 text-sm text-burhan-success">In Stock</div>
            ) : (
              <div className="mt-2 text-sm text-burhan-error">Out of Stock</div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
