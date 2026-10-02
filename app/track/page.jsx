'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, CheckCircle2, Clock, Truck, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeTrack = async (targetId, targetPhone) => {
    const idToUse = (targetId !== undefined ? targetId : orderId).trim();
    const phoneToUse = (targetPhone !== undefined ? targetPhone : phone).trim();

    if (!idToUse) {
      setError('Please enter your Order ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: idToUse, phone: phoneToUse })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = { error: 'Invalid response format' };
      }

      if (response.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found. Please verify your Order ID and mobile number.');
        setOrder(null);
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryOrderId = searchParams.get('orderId');
    const queryPhone = searchParams.get('phone');
    if (queryOrderId) {
      setOrderId(queryOrderId);
      if (queryPhone) setPhone(queryPhone);
      executeTrack(queryOrderId, queryPhone || '');
    }
  }, [searchParams]);

  const handleTrack = (e) => {
    e.preventDefault();
    executeTrack();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'processing':
        return {
          label: 'Confirmed & Processing',
          color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
          icon: Package
        };
      case 'shipped':
        return {
          label: 'Out for Delivery (Shipped)',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: Truck
        };
      case 'delivered':
        return {
          label: 'Delivered',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: CheckCircle2
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: XCircle
        };
      default:
        return {
          label: 'Order Placed (Pending)',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          icon: Clock
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-20 text-slate-900">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center py-6 sm:py-8 border-b border-slate-200/80 mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1">
            Live Tracking
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-md mx-auto">
            Enter your Order ID and registered mobile number to check the status of your parcel.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Order ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-1234 or ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="0300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching Record...' : 'Track Parcel'}</span>
            </button>
          </form>
        </div>

        {/* Tracking Result Card */}
        {order && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Reference</div>
                <div className="font-mono text-lg sm:text-xl font-extrabold text-slate-950">
                  {order._id ? order._id.toUpperCase().slice(0, 16) : orderId}
                </div>
              </div>

              {(() => {
                const badge = getStatusBadge(order.status || 'pending');
                const IconComp = badge.icon;
                return (
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${badge.color}`}>
                    <IconComp className="w-4 h-4" />
                    <span>{badge.label}</span>
                  </span>
                );
              })()}
            </div>

            {/* Recipient and Order Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delivery Destination
                </div>
                <div className="text-sm font-bold text-slate-900">{order.customer?.name}</div>
                <div className="text-xs text-slate-600 mt-0.5">{order.customer?.city}</div>
                <div className="text-xs text-slate-600 mt-1">{order.customer?.address}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Details
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Cash on Delivery (COD)
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Payable upon doorstep delivery: <strong className="text-slate-950">PKR {Number(order.pricing?.total || order.total || 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Ordered Items Mini-list */}
            {order.items && order.items.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Items in Parcel
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-slate-900">{it.name}</span>
                      <span className="text-slate-600">Qty: {it.quantity} × PKR {Number(it.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 pt-24 pb-12 flex items-center justify-center text-slate-600">
        Loading order tracking...
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
