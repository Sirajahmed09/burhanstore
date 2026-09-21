'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';

export default function BestSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-burhan-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
              Best Sellers
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="aspect-square bg-gray-200 skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded skeleton" />
                  <div className="h-6 bg-gray-200 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-burhan-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Best Sellers
          </h2>
          <p className="text-xl text-burhan-text-secondary max-w-2xl mx-auto">
            Most popular products loved by our customers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
