'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Users, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'We only sell authentic, certified products with official warranty'
    },
    {
      icon: Award,
      title: 'Premium Selection',
      description: 'Carefully curated collection of the best technology products'
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'Your satisfaction is our top priority with 24/7 support'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Always bringing the latest technology trends to Pakistan'
    }
  ];

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            About Burhan
          </h1>
          <p className="text-xl text-burhan-text-secondary">
            Powering Your Digital Lifestyle Since Day One
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 mb-8"
        >
          <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
            Our Story
          </h2>
          <div className="text-burhan-text-secondary space-y-4">
            <p>
              Burhan is Pakistan's premier destination for consumer electronics and mobile accessories. 
              We are passionate about bringing the latest technology to our customers at competitive prices 
              without compromising on quality.
            </p>
            <p>
              What started as a small initiative to provide genuine tech products has grown into a trusted 
              brand serving thousands of satisfied customers across Pakistan. Our commitment to authenticity, 
              quality, and customer satisfaction has been the driving force behind our success.
            </p>
            <p>
              We carefully curate every product in our catalog, ensuring that each item meets our strict 
              quality standards. From wireless earbuds to power banks, from smartwatches to gaming accessories, 
              we offer a comprehensive range of products that cater to every tech enthusiast's needs.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-6">
                <div className="w-12 h-12 bg-burhan-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-burhan-secondary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-burhan-primary mb-2">
                  {value.title}
                </h3>
                <p className="text-burhan-text-secondary">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-burhan-secondary to-burhan-accent rounded-2xl p-8 text-center text-white"
        >
          <h2 className="font-heading text-3xl font-bold mb-4">
            Join Our Community
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Experience the Burhan difference today and discover why thousands of customers trust us 
            for their technology needs.
          </p>
          <a
            href="/shop"
            className="inline-block bg-white text-burhan-secondary px-8 py-3 rounded-xl font-semibold hover:bg-burhan-primary hover:text-white transition-colors"
          >
            Start Shopping
          </a>
        </motion.div>
      </div>
    </div>
  );
}
