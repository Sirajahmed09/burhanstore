'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { trackRemoveFromCart, trackBeginCheckout } from '@/lib/analytics/gtag';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useCart();
  const [shippingCost] = useState(200); // PKR 200 flat shipping

  const subtotal = getCartTotal();
  const total = subtotal > 0 ? subtotal + shippingCost : 0;

  const handleRemove = (item) => {
    removeFromCart(item._id);
    trackRemoveFromCart(item, item.quantity);
  };

  const handleCheckoutClick = () => {
    trackBeginCheckout(cart, total);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 flex items-center justify-center text-slate-900">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs">
            <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 mb-3 tracking-tight">
              Your Shopping Cart is Empty
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mb-8 leading-relaxed">
              Looks like you haven't added anything yet. Explore our flagship BURHAN Pro 2 earbuds or browse our full store.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop/burhan-pro-2"
                className="bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>View BURHAN Pro 2</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/shop"
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center shadow-2xs"
              >
                Browse Shop
              </Link>
            </div>
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
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Review your items and proceed to secure cash on delivery checkout
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {cart.map((item) => {
                const itemImg = item.thumbnail || item.images?.[0] || item.image || 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800';
                const itemTotal = Number(item.price) * Number(item.quantity);

                return (
                  <div key={item._id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                    {/* Image & Title */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex-shrink-0">
                        <Image
                          src={itemImg}
                          alt={item.name}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 mb-0.5">
                          {item.category || 'Official Product'}
                        </div>
                        <Link href={`/shop/${item.slug}`}>
                          <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 hover:text-cyan-700 transition-colors truncate">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                          PKR {Number(item.price).toLocaleString()} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Controls */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Stepper */}
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, Math.min(item.stock || 99, item.quantity + 1))}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors font-bold text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-24">
                        <div className="text-sm sm:text-base font-extrabold text-slate-950">
                          PKR {itemTotal.toLocaleString()}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions & Continue Shopping Link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/shop"
                className="text-xs sm:text-sm font-semibold text-cyan-700 hover:text-cyan-800 transition-colors"
              >
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
              >
                Clear Entire Cart
              </button>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
              <h2 className="font-heading text-lg font-bold text-slate-950 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({getCartCount()} items)</span>
                  <span className="font-semibold text-slate-900">PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard Express Shipping</span>
                  <span className="font-semibold text-slate-900">PKR {shippingCost.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-base font-bold text-slate-950">Estimated Total</span>
                  <span className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={handleCheckoutClick}
                className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-98 text-slate-950 font-bold py-4 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Trust Micro-signals */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>Nationwide Express COD in 2-4 days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>1-Year Official Replacement Warranty</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  <span>7-Day Easy Exchange Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
