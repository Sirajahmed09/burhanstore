'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-burhan-background via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-burhan-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-burhan-accent/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-burhan-secondary/10 px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-burhan-secondary" />
              <span className="text-sm font-semibold text-burhan-secondary">
                Premium Technology Brand
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-burhan-primary mb-6 leading-tight"
            >
              Powering Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-burhan-secondary to-burhan-accent">
                Digital Lifestyle
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-burhan-text-secondary mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Experience premium quality with our curated collection of consumer electronics and mobile accessories.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/shop"
                className="group bg-burhan-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl ripple"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/shop"
                className="bg-white text-burhan-primary px-8 py-4 rounded-xl font-semibold text-lg border-2 border-burhan-primary hover:bg-burhan-primary hover:text-white transition-all duration-300 flex items-center justify-center shadow-lg"
              >
                Explore Collection
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-burhan-primary">1000+</div>
                <div className="text-sm text-burhan-text-secondary">Products</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-burhan-primary">50K+</div>
                <div className="text-sm text-burhan-text-secondary">Customers</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-burhan-primary">4.8</div>
                <div className="text-sm text-burhan-text-secondary">Rating</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Product Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=600"
                alt="Premium Earbuds"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl"
            >
              <div className="text-sm font-semibold text-burhan-primary">Premium Quality</div>
              <div className="text-xs text-burhan-text-secondary">Certified Products</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-10 -right-10 bg-white p-4 rounded-2xl shadow-xl"
            >
              <div className="text-sm font-semibold text-burhan-secondary">Fast Delivery</div>
              <div className="text-xs text-burhan-text-secondary">All Over Pakistan</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-6 h-10 border-2 border-burhan-primary rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 bg-burhan-primary rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
