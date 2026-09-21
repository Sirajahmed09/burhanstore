'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Shop by Category
          </h2>
          <p className="text-xl text-burhan-text-secondary max-w-2xl mx-auto">
            Discover our premium collection of technology products
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/category/${category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}>
                <div className="group bg-burhan-background rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 card-glow">
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={category.image}
                      alt={`${category.name} - BURHAN STORE`}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-heading font-semibold text-white text-lg mb-1">
                        {category.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {category.productCount} Products
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 text-burhan-secondary hover:text-burhan-primary font-semibold text-lg group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
