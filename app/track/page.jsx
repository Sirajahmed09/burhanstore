'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, Truck, X } from 'lucide-react';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, phone })
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found');
        setOrder(null);
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-burhan-warning" />;
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-burhan-success" />;
      case 'processing':
        return <Package className="w-6 h-6 text-burhan-secondary" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-burhan-accent" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-burhan-success" />;
      case 'cancelled':
        return <X className="w-6 h-6 text-burhan-error" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-2">
            Track Your Order
          </h1>
          <p className="text-burhan-text-secondary text-lg">
            Enter your order details to track your shipment
          </p>
        </motion.div>

        {/* Track Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 md:p-8 mb-8"
        >
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-burhan-text-primary font-semibold mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                placeholder="Enter your order ID"
                required
              />
            </div>

            <div>
              <label className="block text-burhan-text-primary font-semibold mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                placeholder="03XXXXXXXXX"
                required
              />
            </div>

            {error && (
              <div className="bg-burhan-error/10 border border-burhan-error text-burhan-error rounded-xl p-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-burhan-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              <span>{loading ? 'Tracking...' : 'Track Order'}</span>
            </button>
          </form>
        </motion.div>

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Order Info */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
                Order Details
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-burhan-text-secondary text-sm">Order ID</span>
                  <div className="font-mono font-semibold text-burhan-primary">
                    {order._id.toUpperCase().slice(0, 12)}
                  </div>
                </div>
                <div>
                  <span className="text-burhan-text-secondary text-sm">Order Date</span>
                  <div className="font-semibold text-burhan-primary">
                    {new Date(order.createdAt).toLocaleDateString('en-PK')}
                  </div>
                </div>
                <div>
                  <span className="text-burhan-text-secondary text-sm">Total Amount</span>
                  <div className="font-semibold text-burhan-primary">
                    PKR {order.total.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-burhan-text-secondary text-sm">Payment Method</span>
                  <div className="font-semibold text-burhan-primary capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                Order Status
              </h2>
              <div className="space-y-4">
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-burhan-primary capitalize">
                          {item.status}
                        </div>
                        <div className="text-sm text-burhan-text-secondary">
                          {item.message}
                        </div>
                        <div className="text-xs text-burhan-text-secondary mt-1">
                          {new Date(item.timestamp).toLocaleString('en-PK')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-burhan-text-secondary">No status updates available</div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6">
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-4">
                Delivery Address
              </h2>
              <div className="text-burhan-text-secondary">
                {order.customer.name}<br />
                {order.customer.phone}<br />
                {order.customer.address}<br />
                {order.customer.city}, {order.customer.province}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
