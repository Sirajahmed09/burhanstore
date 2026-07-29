'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useCart();
  const [shippingCost] = useState(200); // PKR 200 flat shipping

  const subtotal = getCartTotal();
  const total = subtotal + shippingCost;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="font-heading text-3xl font-bold text-burhan-primary mb-4">
            Your cart is empty
          </h2>
          <p className="text-burhan-text-secondary mb-8">
            Start shopping to add items to your cart
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 bg-burhan-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-burhan-primary mb-2">
            Shopping Cart
          </h1>
          <p className="text-burhan-text-secondary mb-8">
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 flex gap-6"
              >
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1">
                  <Link href={`/shop/${item.slug}`}>
                    <h3 className="font-semibold text-burhan-primary hover:text-burhan-secondary transition-colors mb-2">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-burhan-text-secondary text-sm mb-3">
                    PKR {item.price.toLocaleString()} each
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-burhan-primary w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price and Remove */}
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-burhan-primary text-lg">
                        PKR {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-burhan-error hover:bg-burhan-error/10 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <Link
                href="/shop"
                className="text-burhan-secondary hover:text-burhan-primary font-semibold flex items-center space-x-2"
              >
                <span>← Continue Shopping</span>
              </Link>
              <button
                onClick={clearCart}
                className="text-burhan-error hover:underline font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 sticky top-24"
            >
              <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-burhan-text-secondary">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-burhan-text-secondary">
                  <span>Shipping</span>
                  <span>PKR {shippingCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold text-burhan-primary text-lg">Total</span>
                  <span className="font-bold text-burhan-primary text-2xl">
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <button className="w-full bg-burhan-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-burhan-secondary transition-colors ripple flex items-center justify-center space-x-2">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              <div className="mt-6 p-4 bg-burhan-background rounded-xl">
                <h3 className="font-semibold text-burhan-primary mb-2">Payment Methods</h3>
                <div className="flex flex-wrap gap-2 text-sm text-burhan-text-secondary">
                  <span className="px-3 py-1 bg-white rounded-full">Cash on Delivery</span>
                  <span className="px-3 py-1 bg-white rounded-full">JazzCash</span>
                  <span className="px-3 py-1 bg-white rounded-full">EasyPaisa</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
