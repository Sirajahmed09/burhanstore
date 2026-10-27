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
      .then(data => setCategories((data?.categories || []).filter(category => Number(category.productCount) > 0)))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white border-b border-[#E2DDD5]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 text-center sm:text-left gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-[#8E7B56] text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-[#F4F2ED] border border-[#E2DDD5] rounded-full">
              <span>Collections</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight">
              Hardware Collections
            </h2>
            <p className="text-[#5A606A] text-sm sm:text-base mt-1">
              Curated audio equipment and mobile accessories
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center space-x-1.5 text-sm font-bold text-[#171A20] hover:text-[#8E7B56] transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 text-[#8E7B56]" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const imgSrc = cat.image || '/images/burhan_pro2_earbuds.jpg';
            return (
              <Link
                key={cat._id || cat.name}
                href={`/category/${slug}`}
                className="group bg-[#F4F2ED] rounded-2xl p-3 border border-[#E2DDD5] hover:border-[#D6D1C7] hover:shadow-xs transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-3">
                  <Image
                    src={imgSrc}
                    alt={`${cat.name} - BURHAN STORE`}
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-heading text-xs sm:text-sm font-bold text-[#171A20] group-hover:text-[#8E7B56] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-[#5A606A] mt-0.5">
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
