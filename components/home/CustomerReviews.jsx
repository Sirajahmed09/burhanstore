'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function CustomerReviews() {
  const reviews = [
    {
      name: 'Ahmed Khan',
      rating: 5,
      comment: 'Excellent quality products! The earbuds I bought are amazing. Fast delivery and great customer service.',
      product: 'Burhan AirPods Pro Max',
      verified: true
    },
    {
      name: 'Fatima Ali',
      rating: 5,
      comment: 'Best online shopping experience. Genuine products with warranty. Highly recommended!',
      product: 'Burhan PowerMax 20000mAh',
      verified: true
    },
    {
      name: 'Usman Malik',
      rating: 5,
      comment: 'Great prices and authentic products. The power bank is exactly as described. Very happy!',
      product: 'Burhan 65W GaN Charger',
      verified: true
    },
    {
      name: 'Ayesha Hassan',
      rating: 5,
      comment: 'Love the smartwatch! Premium quality and worth every penny. Will buy again.',
      product: 'Burhan SmartWatch Ultra',
      verified: true
    }
  ];

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
            What Our Customers Say
          </h2>
          <p className="text-xl text-burhan-text-secondary max-w-2xl mx-auto">
            Trusted by thousands of happy customers across Pakistan
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-shadow card-glow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-burhan-warning text-burhan-warning" />
                  ))}
                </div>
                {review.verified && (
                  <span className="text-xs bg-burhan-success/10 text-burhan-success px-2 py-1 rounded-full font-semibold">
                    Verified
                  </span>
                )}
              </div>

              <Quote className="w-8 h-8 text-burhan-secondary/20 mb-2" />

              <p className="text-burhan-text-secondary mb-4 line-clamp-4">
                "{review.comment}"
              </p>

              <div className="border-t pt-4">
                <div className="font-semibold text-burhan-primary">{review.name}</div>
                <div className="text-sm text-burhan-text-secondary">{review.product}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
