'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, MessageCircle, Truck, ShieldCheck } from 'lucide-react';
import { trackPurchase } from '@/lib/analytics/gtag';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => (res.ok ? res.json() : { order: null }))
        .then(data => {
          const ord = data?.order || null;
          setOrder(ord);
          if (ord && ord._id && typeof window !== 'undefined') {
            const key = `burhan_ga_purchased_${ord._id}`;
            if (!sessionStorage.getItem(key)) {
              trackPurchase(ord);
              sessionStorage.setItem(key, 'true');
            }
          }
        })
        .catch(err => console.error('Failed to load order:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-20 flex items-center justify-center text-slate-900">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-sm text-center">
          {/* Animated Success Icon */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="text-xs uppercase tracking-wider font-bold text-cyan-700 mb-1">
            Order Confirmed
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 mb-3 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Your order has been received and is being prepared for dispatch with cash on delivery across Pakistan.
          </p>

          {/* Order ID Badge */}
          {order && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-8 max-w-md mx-auto">
              <div className="text-xs font-semibold text-slate-500 mb-1">Your Order Reference Number</div>
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider">
                {order._id ? order._id.toUpperCase().slice(0, 16) : 'BURHAN-ORD'}
              </div>
            </div>
          )}

          {/* Delivery Details */}
          {order?.customer && (
            <div className="grid sm:grid-cols-2 gap-4 text-left mb-8">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recipient Details
                </div>
                <div className="text-sm font-bold text-slate-900">{order.customer.name}</div>
                <div className="text-xs text-slate-600 mt-0.5">{order.customer.phone}</div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {order.customer.address}, {order.customer.city}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Payment Summary
                </div>
                <div className="text-xs text-slate-600 flex justify-between py-0.5">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">PKR {Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-600 flex justify-between py-0.5">
                  <span>Delivery:</span>
                  <span className="font-semibold text-slate-900">PKR {Number(order.shipping || 200).toLocaleString()}</span>
                </div>
                <div className="text-sm font-extrabold text-slate-950 flex justify-between pt-1 border-t border-slate-200/60 mt-1">
                  <span>Total Payable:</span>
                  <span className="text-cyan-700">PKR {Number(order.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps Card */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-100 text-xs sm:text-sm text-slate-700 mb-8 text-left space-y-2">
            <div className="font-bold text-slate-900">What happens next?</div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-cyan-700">1.</span>
              <span>Our verification team will confirm your order via phone or WhatsApp.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-cyan-700">2.</span>
              <span>Your package will be dispatched via courier with tracking updates.</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-bold text-cyan-700">3.</span>
              <span>You pay cash only upon receiving and inspecting your parcel at your doorstep.</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/03150693148?text=Hello%20BURHAN%20STORE,%20I%20just%20placed%20an%20order!"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us for Fast Dispatch</span>
            </a>
            <Link
              href="/"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Return to Store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center text-slate-600">
        Loading confirmation...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
