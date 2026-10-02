'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { CheckCircle2, ShieldCheck, Truck, RotateCcw, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

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
  const [submitError, setSubmitError] = useState('');
  const [validationWarning, setValidationWarning] = useState('');

  const shippingCost = 200;
  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;

  // Validate cart items on mount to ensure all items are still active and available
  useEffect(() => {
    if (cart.length > 0) {
      fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.issues && data.issues.length > 0) {
            setValidationWarning(data.issues.map(i => i.message).join(' '));
          }
        })
        .catch(err => console.error('Cart validation check failed:', err));
    }
  }, [cart]);

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
      newErrors.phone = 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +92 300 1234567)';
    }

    if (formData.alternatePhone) {
      const cleanAlt = String(formData.alternatePhone).trim().replace(/[\s\-\(\)]/g, '').replace(/^(\+92|0092|92)/, '0');
      if (!/^03\d{9}$/.test(cleanAlt)) {
        newErrors.alternatePhone = 'Invalid alternate phone number';
      }
    }

    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;
    if (cart.length === 0) {
      setSubmitError('Your cart is empty');
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
        setSubmitError(data.error || 'Failed to place order. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Order error:', error);
      setSubmitError('An unexpected network error occurred. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 flex items-center justify-center text-slate-900">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-slate-950 mb-2">
              Your cart is empty
            </h1>
            <p className="text-slate-600 text-sm mb-6">
              Add items before checking out.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-cyan-600 transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-20 text-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="py-6 border-b border-slate-200/80 mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1">
            Fast & Safe Checkout
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Checkout
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Complete your order with cash on delivery across Pakistan
          </p>
        </div>

        {validationWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center justify-between">
            <span>{submitError}</span>
            <button
              type="button"
              onClick={() => setSubmitError('')}
              className="text-red-500 hover:text-red-700 text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer & Delivery Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-950 pb-3 border-b border-slate-100">
                  1. Delivery Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Siraj Khan"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        errors.fullName ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Primary Mobile */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mobile Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300 1234567"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        errors.phone ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Alternate Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Alternate Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      placeholder="0312 9876543"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="siraj@example.com (for order receipt)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Province *
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        errors.province ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-xs text-red-600 mt-1">{errors.province}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Karachi, Lahore"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        errors.city ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                    )}
                  </div>

                  {/* Complete Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Complete Street Address *
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House / Flat #, Street #, Sector / Area, Landmark"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        errors.address ? 'border-red-400 bg-red-50/50' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-600 mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* Order Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Delivery Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. Call before delivery, deliver after 2 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-950 pb-3 border-b border-slate-100">
                  2. Payment Method
                </h2>

                <div className="space-y-3">
                  {/* COD */}
                  <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.paymentMethod === 'cod'
                      ? 'border-cyan-500 bg-cyan-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="mt-1 w-4 h-4 accent-cyan-600"
                    />
                    <div className="ml-3.5">
                      <div className="font-bold text-sm sm:text-base text-slate-900">
                        Cash on Delivery (COD)
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Pay cash directly to the courier rider upon receiving your parcel at your doorstep anywhere in Pakistan.
                      </div>
                    </div>
                  </label>

                  {/* Card / Bank Transfer */}
                  <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.paymentMethod === 'card'
                      ? 'border-cyan-500 bg-cyan-50/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="mt-1 w-4 h-4 accent-cyan-600"
                    />
                    <div className="ml-3.5">
                      <div className="font-bold text-sm sm:text-base text-slate-900">
                        Debit / Credit Card & Bank Transfer
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Direct bank account transfer or portable card POS machine on delivery.
                      </div>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === 'card' && (
                  <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-cyan-900 block mb-1">Payment Instructions:</strong>
                    No online credit/debit card numbers are entered on this website. Once your order is placed, our support team will reach out via WhatsApp/phone with official bank transfer account details or arrange a portable card machine for doorstep delivery.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary & Confirmation CTA */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
                <h2 className="font-heading text-lg font-bold text-slate-950 pb-3 border-b border-slate-100">
                  Order Summary
                </h2>

                {/* Items Mini-list */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item._id} className="pt-2.5 first:pt-0 flex items-center space-x-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0">
                        <Image
                          src={item.thumbnail || item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800'}
                          alt={item.name}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <div className="text-xs text-slate-500">
                          Qty: {item.quantity} × PKR {Number(item.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-950 whitespace-nowrap">
                        PKR {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">PKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Express Shipping</span>
                    <span className="font-semibold text-slate-900">PKR {shippingCost.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm sm:text-base font-bold text-slate-950">Grand Total</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                      PKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold py-4 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Place Order — PKR {total.toLocaleString()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Open Parcel Verification on delivery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Official 1-Year Replacement Warranty</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>1-3 business days express courier across Pakistan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
