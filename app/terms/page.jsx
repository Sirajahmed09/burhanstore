'use client';

import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Terms & Conditions
          </h1>
          <p className="text-burhan-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-8 space-y-6 text-burhan-text-secondary">
          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the Burhan website, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              2. Products and Services
            </h2>
            <p className="mb-4">
              We strive to provide accurate product descriptions and images. However:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Product images are for illustration purposes and may vary slightly from actual products</li>
              <li>We reserve the right to modify product specifications without prior notice</li>
              <li>Prices are subject to change without notice</li>
              <li>Product availability may vary</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              3. Orders and Payments
            </h2>
            <p className="mb-4">
              When placing an order:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All orders are subject to acceptance and availability</li>
              <li>We reserve the right to refuse or cancel any order</li>
              <li>Payment must be completed before order dispatch (except for COD orders)</li>
              <li>Prices include applicable taxes unless stated otherwise</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              4. Delivery
            </h2>
            <p className="mb-4">
              Regarding deliveries:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery times are estimates and not guaranteed</li>
              <li>We are not liable for delays caused by third-party couriers</li>
              <li>You must provide accurate delivery information</li>
              <li>Risk of loss passes to you upon delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              5. Warranty and Liability
            </h2>
            <p className="mb-4">
              Products are sold with manufacturer warranties where applicable. We:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate warranty claims with manufacturers</li>
              <li>Are not liable for manufacturer defects beyond our control</li>
              <li>Limit our liability to the purchase price of the product</li>
              <li>Do not guarantee uninterrupted website availability</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              6. Intellectual Property
            </h2>
            <p>
              All content on this website, including text, images, logos, and designs, is the property of 
              Burhan and protected by copyright laws. You may not reproduce, distribute, or use any content 
              without our written permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              7. User Conduct
            </h2>
            <p className="mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the website for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the website</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              8. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts 
              of Karachi, Pakistan.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the website after 
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              10. Contact Information
            </h2>
            <p>
              For questions about these terms:
              <br />
              Email: infoburhancommunication@gmail.com
              <br />
              Phone: 03013301830
              <br />
              Address: Karachi, Sindh, Pakistan
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
