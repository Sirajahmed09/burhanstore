'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => (res.ok ? res.json() : { order: null }))
        .then(data => setOrder(data?.order || null))
        .catch(err => console.error('Failed to load order:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 md:p-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-burhan-success rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-burhan-primary mb-4">
            Order Placed Successfully!
          </h1>

          {order && (
            <>
              <p className="text-burhan-text-secondary text-lg mb-6">
                Thank you for your order. Your order has been received and is being processed.
              </p>

              <div className="bg-burhan-background rounded-xl p-6 mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Package className="w-5 h-5 text-burhan-secondary" />
                  <span className="text-burhan-text-secondary font-semibold">Order ID</span>
                </div>
                <div className="font-mono text-2xl font-bold text-burhan-primary">
                  {order._id.toUpperCase().slice(0, 12)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-burhan-background rounded-xl p-4">
                  <h3 className="font-semibold text-burhan-primary mb-2">Delivery Address</h3>
                  <p className="text-burhan-text-secondary text-sm">
                    {order.customer.name}<br />
                    {order.customer.phone}<br />
                    {order.customer.address}<br />
                    {order.customer.city}, {order.customer.province}
                  </p>
                </div>

                <div className="bg-burhan-background rounded-xl p-4">
                  <h3 className="font-semibold text-burhan-primary mb-2">Order Summary</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-burhan-text-secondary">
                      <span>Subtotal:</span>
                      <span>PKR {order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-burhan-text-secondary">
                      <span>Shipping:</span>
                      <span>PKR {order.shipping.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-burhan-primary pt-2 border-t">
                      <span>Total:</span>
                      <span>PKR {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
                <p className="text-burhan-text-primary text-sm">
                  <strong>Note:</strong> You will receive a confirmation call shortly. Our delivery team will contact you for order confirmation and delivery schedule.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/track?orderId=${orderId || ''}&phone=${order?.customer?.phone || ''}`}
              className="bg-burhan-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors flex items-center justify-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>Track Order</span>
            </Link>
            <Link
              href="/shop"
              className="bg-white text-burhan-primary border-2 border-burhan-primary px-8 py-3 rounded-xl font-semibold hover:bg-burhan-primary hover:text-white transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-burhan-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-burhan-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
