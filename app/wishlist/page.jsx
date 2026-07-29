'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, Heart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useCart } from '@/lib/contexts/CartContext';
import ProductCard from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="font-heading text-3xl font-bold text-burhan-primary mb-4">
            Your wishlist is empty
          </h2>
          <p className="text-burhan-text-secondary mb-8">
            Start adding products you love to your wishlist
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 bg-burhan-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
          >
            <span>Continue Shopping</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-2">
            My Wishlist
          </h1>
          <p className="text-burhan-text-secondary">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
