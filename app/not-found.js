'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-9xl font-bold text-burhan-secondary mb-8"
          >
            404
          </motion.div>

          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Page Not Found
          </h1>

          <p className="text-xl text-burhan-text-secondary mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 bg-burhan-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center space-x-2 bg-white text-burhan-primary border-2 border-burhan-primary px-8 py-4 rounded-xl font-semibold hover:bg-burhan-primary hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Browse Products</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
