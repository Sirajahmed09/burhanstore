'use client';

import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppCTA() {
  const whatsappNumber = '03150693148';
  const message = 'Hi! I am interested in your products.';

  return (
    <section className="py-20 bg-gradient-to-r from-burhan-secondary to-burhan-accent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <MessageCircle className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Need Help? Chat with Us!
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Have questions? Our team is here to help you 24/7 on WhatsApp
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 bg-white text-burhan-secondary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-burhan-primary hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl ripple"
          >
            <MessageCircle className="w-6 h-6" />
            <span>Chat on WhatsApp</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
