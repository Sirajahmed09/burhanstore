'use client';

import { motion } from 'framer-motion';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Refund & Return Policy
          </h1>
          <p className="text-burhan-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-8 space-y-6 text-burhan-text-secondary">
          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Return Eligibility
            </h2>
            <p className="mb-4">
              We want you to be completely satisfied with your purchase. You may return products within 7 days 
              of delivery if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The product is unused and in original condition</li>
              <li>All original packaging, tags, and accessories are intact</li>
              <li>The product is not damaged or altered</li>
              <li>You have the original receipt or proof of purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Non-Returnable Items
            </h2>
            <p className="mb-4">
              The following items cannot be returned:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Items damaged due to misuse or mishandling</li>
              <li>Products with broken seals or opened packaging (for hygiene reasons)</li>
              <li>Items without original tags or packaging</li>
              <li>Products purchased during clearance sales (unless defective)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Return Process
            </h2>
            <p className="mb-4">
              To initiate a return:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our customer support within 7 days of receiving your order</li>
              <li>Provide your order number and reason for return</li>
              <li>Our team will guide you through the return process</li>
              <li>Ship the product back in its original packaging</li>
              <li>Once we receive and inspect the product, we'll process your refund</li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Refund Processing
            </h2>
            <p className="mb-4">
              After your return is approved:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refunds are processed within 7-10 business days</li>
              <li>For Cash on Delivery orders, refunds are issued via bank transfer</li>
              <li>For online payments, refunds are credited to the original payment method</li>
              <li>Shipping charges are non-refundable unless the product is defective</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Exchanges
            </h2>
            <p>
              We gladly accept exchanges for the same product in a different variant (if available). 
              Contact our customer support to arrange an exchange.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Damaged or Defective Products
            </h2>
            <p>
              If you receive a damaged or defective product, please contact us immediately with photos. 
              We will arrange a replacement or full refund at no additional cost to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Contact for Returns
            </h2>
            <p>
              For return inquiries:
              <br />
              WhatsApp: 03150693148
              <br />
              Phone: 03013301830
              <br />
              Email: infoburhancommunication@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
