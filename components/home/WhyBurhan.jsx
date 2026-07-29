'use client';

import { motion } from 'framer-motion';
import { Shield, Truck, CreditCard, Headphones } from 'lucide-react';

export default function WhyBurhan() {
  const features = [
    {
      icon: Shield,
      title: 'Premium Quality',
      description: 'Only authentic, certified products with official warranty'
    },
    {
      icon: Truck,
      title: 'Fast Shipping',
      description: 'Quick delivery across Pakistan within 2-5 business days'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Cash on Delivery, JazzCash, EasyPaisa & Card payments'
    },
    {
      icon: Headphones,
      title: 'Trusted Support',
      description: '24/7 customer support to assist you anytime'
    }
  ];

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
            Why Choose Burhan?
          </h2>
          <p className="text-xl text-burhan-text-secondary max-w-2xl mx-auto">
            Your trusted partner for premium technology products
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-burhan-secondary/10 rounded-2xl mb-4">
                <feature.icon className="w-8 h-8 text-burhan-secondary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-burhan-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-burhan-text-secondary">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
