'use client';

import { cartLineKey } from '@/lib/commerce/colourVariants';

import SecurityCheck from '@/components/checkout/SecurityCheck';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { CheckCircle2, ShieldCheck, Truck, RotateCcw, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { resolveShippingFee } from '@/lib/commerce/shipping';
import { trackBeginCheckout } from '@/lib/analytics/gtag';
import { normalizePakistaniPhone } from '@/lib/utils/phone';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart, replaceCart, isLoaded } = useCart();
  const [loading, setLoading] = useState(false);
  const submissionIdRef = useRef(null);
  const submittingRef = useRef(false);
  const submissionFingerprintRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    province: '',
    city: '',
    address: '',
    notes: '',
    paymentMethod: 'cod',
    website: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [humanToken, setHumanToken] = useState('');
  const [challengeReset, setChallengeReset] = useState(0);
  const [validationWarning, setValidationWarning] = useState('');

  const { settings, error: settingsError, loading: settingsLoading } = useStoreSettings();
  const shippingCost = resolveShippingFee(settings || {}, formData);
  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;

  const [cartChecking, setCartChecking] = useState(true);
  const analyticsCheckoutRef = useRef(null);
  const [cartError, setCartError] = useState('');
  useEffect(() => {
    if (!isLoaded) return;
    if (!cart.length) { setCartChecking(false); return; }
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    setCartChecking(true);
    setCartError('');
    fetch('/api/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart }), signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to check your cart. Please refresh and try again.');
        const data = await response.json();
        if (!active) return;
        if (!Array.isArray(data.items)) throw new Error('Cart check is unavailable. Please refresh.');
        const signature = items => JSON.stringify(items.map(item => [cartLineKey(item), item.color, Number(item.quantity), Number(item.price)]));
        if (signature(data.items) !== signature(cart)) {
          replaceCart(data.items);
          setValidationWarning('Your cart was updated with the latest price and availability. Please review the total before ordering.');
        }
        if (data.issues?.length) setValidationWarning(data.issues.map(issue => issue.message).join(' '));
      })
      .catch(error => { if (active) setCartError(controller.signal.aborted ? 'Cart check timed out. Please refresh and try again.' : error.message); })
      .finally(() => { clearTimeout(timeout); if (active) setCartChecking(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [cart, isLoaded, replaceCart]);

  useEffect(() => {
    if (!isLoaded || !cart.length || cartChecking || cartError || settingsLoading || settingsError) return;
    const key = JSON.stringify([cart.map(item => [cartLineKey(item), item.quantity, item.price]), total]);
    if (analyticsCheckoutRef.current !== key) {
      trackBeginCheckout(cart, total);
      analyticsCheckoutRef.current = key;
    }
  }, [cart, total, isLoaded, cartChecking, cartError, settingsLoading, settingsError]);

  const provinces = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Gilgit-Baltistan',
    'Azad Kashmir',
    'Islamabad Capital Territory'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    // Normalize phone number (handle spaces, dashes, +92, 0092, 92)
    const rawPhone = String(formData.phone || '').trim();
    const cleanPhone = normalizePakistaniPhone(rawPhone);

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!rawPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!cleanPhone) {
      newErrors.phone = 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +92 300 1234567)';
    }

    if (formData.alternatePhone) {
      const cleanAlt = normalizePakistaniPhone(formData.alternatePhone);
      if (!cleanAlt) {
        newErrors.alternatePhone = 'Invalid alternate phone number';
      }
    }

    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current || loading || settingsLoading || cartChecking || cartError) return;
    if (settingsError) { setSubmitError(settingsError); return; }
    setSubmitError('');
    
    if (!validateForm()) return;
    if (settings?.turnstileSiteKey && !humanToken) { setSubmitError('Please complete the security check.'); return; }
    if (cart.length === 0) {
      setSubmitError('Your cart is empty');
      return;
    }

    const cartFingerprint = JSON.stringify({ items: cart.map(i => `${cartLineKey(i)}:${i.quantity}`).sort(), customer: formData });
    let submissionKey = submissionFingerprintRef.current === cartFingerprint ? submissionIdRef.current : null;
    if (!submissionKey && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('burhan_pending_checkout');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.fingerprint === cartFingerprint && parsed.key) {
            submissionKey = parsed.key;
          }
        }
      } catch (e) {}
    }
    if (!submissionKey) {
      submissionKey = 'chk_' + crypto.randomUUID();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('burhan_pending_checkout', JSON.stringify({ key: submissionKey, fingerprint: cartFingerprint, timestamp: Date.now() }));
        } catch (e) {}
      }
    }
    submissionIdRef.current = submissionKey;
    submissionFingerprintRef.current = cartFingerprint;

    submittingRef.current = true;
    setLoading(true);

    try {
      const cleanPhone = normalizePakistaniPhone(formData.phone) || String(formData.phone).trim();
      const cleanAltPhone = formData.alternatePhone
        ? (normalizePakistaniPhone(formData.alternatePhone) || String(formData.alternatePhone).trim())
        : '';

      const orderData = {
        website: formData.website,
        humanToken,
        clientReferenceId: submissionIdRef.current,
        items: cart.map(item => ({
          productId: item._id,
          variantId: item.variantId || '',
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
        try {
          sessionStorage.setItem(`burhan_order_${data.order._id}`, JSON.stringify(data.order));
          sessionStorage.removeItem('burhan_pending_checkout');
        } catch {
          // A saved order remains successful when browser storage is blocked/full.
        }
        clearCart();
        router.push(`/success?orderId=${encodeURIComponent(data.order._id)}`);
      } else {
        // If server indicated an inventory or validation error, clear the reference so fresh cart edits can proceed
        if (response.status < 500) submissionIdRef.current = null;
        if (response.status < 500 && typeof window !== 'undefined') {
          sessionStorage.removeItem('burhan_pending_checkout');
        }
        setHumanToken('');
        setChallengeReset(value => value + 1);
        setSubmitError(data.error || 'Failed to place order. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Order error:', error);
      setHumanToken('');
      setChallengeReset(value => value + 1);
      // Notice: Do NOT clear submissionKey from sessionStorage or submissionIdRef.
      // This ensures if the order was created on the server before the connection dropped,
      // retrying will securely recover the existing order without creating a duplicate.
      setSubmitError('A network error occurred while confirming your order. Your cart is preserved. Please click "Place Order" again to safely verify and complete your order without duplicate billing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="pt-32 p-8 text-center" role="status">Loading your cart...</div>;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] pt-24 pb-16 flex items-center justify-center text-[#171A20]">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="bg-white rounded-3xl p-8 border border-[#E2DDD5] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#F4F2ED] text-[#5A606A] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#8E7B56]" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-[#171A20] mb-2">
              Your cart is empty
            </h1>
            <p className="text-[#5A606A] text-sm mb-6">
              Add items before checking out.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-[#171A20] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#0B0D10] transition-colors"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4 text-[#B9A47C]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] pt-20 md:pt-24 pb-32 md:pb-20 text-[#171A20]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="py-6 border-b border-[#E2DDD5] mb-8">
          <div className="inline-flex items-center space-x-2 text-[#8E7B56] text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-white border border-[#E2DDD5] rounded-full">
            <span>Fast & Safe Checkout</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight">
            Checkout
          </h1>
          <p className="text-[#5A606A] text-sm mt-1">
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

        <form id="checkout-form" onSubmit={handleSubmit}>
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden"><label htmlFor="checkout-website">Leave this field empty</label><input id="checkout-website" name="website" autoComplete="off" tabIndex={-1} value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} /></div>
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
                    <label htmlFor="checkout-fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input id="checkout-fullName" name="fullName" autoComplete="name" inputMode="text"
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
                    <label htmlFor="checkout-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mobile Number (WhatsApp) *
                    </label>
                    <input id="checkout-phone" name="phone" autoComplete="tel" inputMode="tel"
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
                    <label htmlFor="checkout-alternatePhone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Alternate Phone (Optional)
                    </label>
                    <input id="checkout-alternatePhone" name="alternatePhone" autoComplete="tel" inputMode="tel"
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      placeholder="0312 9876543"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input id="checkout-email" name="email" autoComplete="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="siraj@example.com (for order receipt)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  {errors.email && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{errors.email}</p>}

                  {/* Province */}
                  <div>
                    <label htmlFor="checkout-province" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Province *
                    </label>
                    <select id="checkout-province" name="province" autoComplete="address-level1"
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
                    <label htmlFor="checkout-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      City *
                    </label>
                    <input id="checkout-city" name="city" autoComplete="address-level2" inputMode="text"
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
                    <label htmlFor="checkout-address" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Complete Street Address *
                    </label>
                    <textarea id="checkout-address" name="address" autoComplete="street-address"
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
                    <label htmlFor="checkout-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Delivery Instructions (Optional)
                    </label>
                    <input id="checkout-notes" name="notes" autoComplete="off"
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

                </div>
                <p className="text-xs text-slate-600">Online payment is currently unavailable. You can complete your order with Cash on Delivery.</p>
              </div>
            </div>

            {/* Right Column: Order Summary & Confirmation CTA */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
                <h2 className="font-heading text-lg font-bold text-slate-950 pb-3 border-b border-slate-100">
                  Order Summary
                </h2>

                {cartError && <p role="alert" className="text-sm text-red-700">{cartError}</p>}
                {cartChecking && <p role="status" className="text-sm text-slate-600">Checking the latest price and availability...</p>}
                {settingsError && <p role="alert" className="text-sm text-red-700">{settingsError}</p>}
                {settingsLoading && <p role="status" className="text-sm text-slate-600">Loading delivery charges...</p>}
                {/* Items Mini-list */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={cartLineKey(item)} className="pt-2.5 first:pt-0 flex items-center space-x-3">
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
                          {item.name}{item.color ? ` · ${item.color}` : ''}
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
                    <span>Delivery</span>
                    <span className="font-semibold text-slate-900">PKR {shippingCost.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm sm:text-base font-bold text-slate-950">Grand Total</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                      PKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {settings?.turnstileSiteKey && <SecurityCheck key={challengeReset} siteKey={settings.turnstileSiteKey} onToken={setHumanToken} />}
                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={loading || settingsLoading || !!settingsError || cartChecking || !!cartError}
                  className="w-full bg-[#171A20] hover:bg-[#0B0D10] active:scale-98 text-white font-bold py-4 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span>Questions about delivery? Contact our store</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Direct Store Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Estimated delivery: 2–5 business days, depending on location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-[#E2DDD5] p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg">
          <button type="submit" form="checkout-form" disabled={loading || settingsLoading || !!settingsError || cartChecking || !!cartError} className="w-full bg-[#171A20] text-white font-bold rounded-xl py-3 disabled:opacity-50">{loading ? 'Confirming...' : `Place COD Order — PKR ${total.toLocaleString()}`}</button>
        </div>
      </div>
    </div>
  );
}
