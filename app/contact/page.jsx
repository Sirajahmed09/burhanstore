'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just alert - in production, this would send to backend
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-burhan-text-secondary">
            We'd love to hear from you. Reach out to us anytime!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-burhan-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-burhan-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-burhan-primary mb-1">Phone</h3>
                    <p className="text-burhan-text-secondary">03013301830</p>
                    <p className="text-burhan-text-secondary text-sm">Mon-Sat, 10AM-8PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-burhan-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-burhan-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-burhan-primary mb-1">WhatsApp</h3>
                    <p className="text-burhan-text-secondary">03150693148</p>
                    <p className="text-burhan-text-secondary text-sm">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-burhan-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-burhan-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-burhan-primary mb-1">Email</h3>
                    <p className="text-burhan-text-secondary break-all">
                      infoburhancommunication@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-burhan-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-burhan-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-burhan-primary mb-1">Location</h3>
                    <p className="text-burhan-text-secondary">Karachi</p>
                    <p className="text-burhan-text-secondary">Sindh, Pakistan</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-burhan-secondary to-burhan-accent rounded-2xl p-8 text-white">
              <h3 className="font-heading text-2xl font-bold mb-4">
                Quick Support
              </h3>
              <p className="text-white/90 mb-6">
                Need immediate assistance? Chat with us on WhatsApp for instant support.
              </p>
              <a
                href="https://wa.me/03150693148?text=Hi!%20I%20need%20assistance"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-burhan-secondary px-6 py-3 rounded-xl font-semibold hover:bg-burhan-primary hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-8">
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-burhan-text-primary font-semibold mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-burhan-text-primary font-semibold mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-burhan-text-primary font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="03XXXXXXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-burhan-text-primary font-semibold mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="How can we help you?"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-burhan-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
