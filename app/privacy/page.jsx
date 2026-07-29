'use client';

import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-4">
            Privacy Policy
          </h1>
          <p className="text-burhan-text-secondary">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-8 space-y-6 text-burhan-text-secondary">
          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Information We Collect
            </h2>
            <p className="mb-4">
              When you place an order or create an account with Burhan, we collect personal information including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and contact information (phone number, email address)</li>
              <li>Delivery address</li>
              <li>Payment information</li>
              <li>Order history and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              How We Use Your Information
            </h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and deliveries</li>
              <li>Provide customer support</li>
              <li>Improve our products and services</li>
              <li>Send promotional offers (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Information Security
            </h2>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized 
              access, alteration, disclosure, or destruction. However, no method of transmission over the internet 
              is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Sharing Your Information
            </h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your 
              information with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery partners to fulfill your orders</li>
              <li>Payment processors to process transactions</li>
              <li>Service providers who assist in operating our website</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Your Rights
            </h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
              Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: infoburhancommunication@gmail.com
              <br />
              Phone: 03013301830
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
