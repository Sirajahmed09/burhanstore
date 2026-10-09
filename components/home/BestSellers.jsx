'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

export default function BestSellers({ products: initialProducts = null }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    if (!initialProducts) {
      fetch(`/api/products/best-sellers?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => (res.ok ? res.json() : { products: [] }))
        .then(data => {
          setProducts(data?.products || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load products:', err);
          setLoading(false);
        });
    } else {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [initialProducts]);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <div className="h-4 bg-slate-100 rounded w-24 mx-auto mb-2" />
            <div className="h-8 bg-slate-100 rounded w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                <div className="aspect-square bg-slate-200 rounded-xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no additional active products exist, do not render duplicate or empty section
  if (!products || products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 text-center sm:text-left gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
              <span>Customer Favorites</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Featured Audio & Electronics
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Top-rated devices with nationwide cash on delivery
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center space-x-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-800 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-cyan-700"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
