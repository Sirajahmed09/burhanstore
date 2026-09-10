'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    province: '',
    city: '',
    address: '',
    notes: '',
    paymentMethod: 'cod'
  });
  const [errors, setErrors] = useState({});

  const shippingCost = 200;
  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;

  const provinces = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Gilgit-Baltistan',
    'Azad Kashmir'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    // Normalize phone number (handle spaces, dashes, +92, 0092, 92)
    const rawPhone = String(formData.phone || '').trim();
    const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '').replace(/^(\+92|0092|92)/, '0');

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!rawPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^03\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid Pakistani mobile number (e.g., 03001234567 or +92 300 1234567)';
    }

    if (formData.alternatePhone) {
      const cleanAlt = String(formData.alternatePhone).trim().replace(/[\s\-\(\)]/g, '').replace(/^(\+92|0092|92)/, '0');
      if (!/^03\d{9}$/.test(cleanAlt)) {
        newErrors.alternatePhone = 'Invalid alternate phone number';
      }
    }

    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = String(formData.phone).trim().replace(/[\s\-\(\)]/g, '').replace(/^(\+92|0092|92)/, '0');
      const cleanAltPhone = formData.alternatePhone
        ? String(formData.alternatePhone).trim().replace(/[\s\-\(\)]/g, '').replace(/^(\+92|0092|92)/, '0')
        : '';

      const orderData = {
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          image: item.thumbnail || item.image,
          price: item.price,
          quantity: item.quantity
        })),
        customer: {
          name: formData.fullName.trim(),
          phone: cleanPhone,
          alternatePhone: cleanAltPhone,
          email: formData.email.trim(),
          province: formData.province,
          city: formData.city.trim(),
          address: formData.address.trim()
        },
        subtotal,
        shipping: shippingCost,
        total,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes ? formData.notes.trim() : ''
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error('Invalid response from server');
      }

      if (response.ok && data.success) {
        clearCart();
        router.push(`/success?orderId=${data.order._id}`);
      } else {
        alert(data.error || 'Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-burhan-primary mb-4">
            Your cart is empty
          </h2>
          <a
            href="/shop"
            className="text-burhan-secondary hover:text-burhan-primary font-semibold"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-2">
            Checkout
          </h1>
          <p className="text-burhan-text-secondary">Complete your order</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6"
              >
                <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                  Customer Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Full Name <span className="text-burhan-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.fullName ? 'border-burhan-error' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-burhan-error text-sm mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Phone Number <span className="text-burhan-error">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.phone ? 'border-burhan-error' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary`}
                      placeholder="03XXXXXXXXX"
                    />
                    {errors.phone && (
                      <p className="text-burhan-error text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Alternate Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                      placeholder="03XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6"
              >
                <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                  Shipping Address
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Province <span className="text-burhan-error">*</span>
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.province ? 'border-burhan-error' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary`}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-burhan-error text-sm mt-1">{errors.province}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      City <span className="text-burhan-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`w-full px-4 py-3 border ${errors.city ? 'border-burhan-error' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary`}
                      placeholder="Enter your city"
                    />
                    {errors.city && (
                      <p className="text-burhan-error text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Complete Address <span className="text-burhan-error">*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-3 border ${errors.address ? 'border-burhan-error' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary`}
                      placeholder="House/Flat number, Street name, Area"
                    />
                    {errors.address && (
                      <p className="text-burhan-error text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-burhan-text-primary font-semibold mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                      placeholder="Any special instructions for delivery"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6"
              >
                <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-burhan-secondary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-burhan-secondary"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-burhan-primary">Cash on Delivery</div>
                      <div className="text-sm text-burhan-text-secondary">Pay when you receive</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-burhan-secondary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="jazzcash"
                      checked={formData.paymentMethod === 'jazzcash'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-burhan-secondary"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-burhan-primary">JazzCash</div>
                      <div className="text-sm text-burhan-text-secondary">Mobile wallet payment</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-burhan-secondary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="easypaisa"
                      checked={formData.paymentMethod === 'easypaisa'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-5 h-5 text-burhan-secondary"
                    />
                    <div className="ml-4">
                      <div className="font-semibold text-burhan-primary">EasyPaisa</div>
                      <div className="text-sm text-burhan-text-secondary">Mobile wallet payment</div>
                    </div>
                  </label>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 sticky top-24"
              >
                <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                  Order Summary
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item._id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.thumbnail}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-burhan-primary line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-sm text-burhan-text-secondary">
                          {item.quantity} × PKR {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-burhan-text-secondary">
                    <span>Subtotal</span>
                    <span>PKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-burhan-text-secondary">
                    <span>Shipping</span>
                    <span>PKR {shippingCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-burhan-primary text-lg">Total</span>
                  <span className="font-bold text-burhan-primary text-2xl">
                    PKR {total.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-burhan-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
