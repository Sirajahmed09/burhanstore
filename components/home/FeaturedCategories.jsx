'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`/api/categories?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { categories: [] }))
      .then(data => setCategories(data?.categories || []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 text-center sm:text-left gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
              <span>Categories</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Explore Collections
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Curated hardware and everyday accessories
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center space-x-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-800 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const imgSrc = cat.image || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400';
            return (
              <Link
                key={cat._id || cat.name}
                href={`/category/${slug}`}
                className="group bg-white rounded-2xl p-3 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <Image
                    src={imgSrc}
                    alt={`${cat.name} - BURHAN STORE`}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-heading text-xs sm:text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {cat.productCount ? `${cat.productCount} Item${cat.productCount > 1 ? 's' : ''}` : 'Official Store'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
