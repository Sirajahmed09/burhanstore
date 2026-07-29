'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How can I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. Fill in your delivery details and select your preferred payment method to complete your order.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery (COD), JazzCash, EasyPaisa, and debit card payments. Choose your preferred method at checkout.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Standard delivery takes 2-5 business days depending on your location. We deliver across all major cities in Pakistan.'
    },
    {
      question: 'Do you provide warranty on products?',
      answer: 'Yes! All our products come with an official warranty ranging from 6 months to 1 year, depending on the product. Warranty details are mentioned on each product page.'
    },
    {
      question: 'Can I return or exchange a product?',
      answer: 'Yes, we accept returns and exchanges within 7 days of delivery if the product is unused and in original packaging. Please refer to our Refund Policy for details.'
    },
    {
      question: 'Are your products authentic?',
      answer: 'Absolutely! We only sell 100% authentic, certified products from authorized distributors. All products come with official warranty.'
    },
    {
      question: 'How can I track my order?',
      answer: 'After placing your order, you will receive an Order ID. Use the "Track Order" page with your Order ID and phone number to check your order status.'
    },
    {
      question: 'Do you ship to all cities in Pakistan?',
      answer: 'Yes, we ship to all major cities and most areas across Pakistan. Shipping charges and delivery time may vary by location.'
    },
    {
      question: 'What if I receive a damaged product?',
      answer: 'Please inspect your order upon delivery. If you receive a damaged product, contact us immediately through WhatsApp or phone, and we will arrange a replacement.'
    },
    {
      question: 'How can I contact customer support?',
      answer: 'You can reach us via WhatsApp at 03150693148, call us at 03013301830, or email us at infoburhancommunication@gmail.com. We are available 24/7 to assist you.'
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
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-burhan-text-secondary">
            Find answers to common questions about our products and services
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-burhan-primary pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-burhan-secondary flex-shrink-0" />
                ) : (
                  <Plus className="w-5 h-5 text-burhan-secondary flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-burhan-text-secondary">
                  {faq.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-gradient-to-r from-burhan-secondary to-burhan-accent rounded-2xl p-8 text-center text-white"
        >
          <h2 className="font-heading text-2xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-white/90 mb-6">
            Can't find the answer you're looking for? Contact our customer support team.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-burhan-secondary px-8 py-3 rounded-xl font-semibold hover:bg-burhan-primary hover:text-white transition-colors"
          >
            Contact Us
          </a>
        </motion.div>
      </div>
    </div>
  );
}
