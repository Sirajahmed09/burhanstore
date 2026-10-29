'use client';

import { cartLineKey } from '@/lib/commerce/colourVariants';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { resolveShippingFee } from '@/lib/commerce/shipping';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { trackRemoveFromCart, trackBeginCheckout } from '@/lib/analytics/gtag';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useCart();
  const { settings } = useStoreSettings();
  const shippingCost = resolveShippingFee(settings || {});

  const subtotal = getCartTotal();
  const total = subtotal > 0 ? subtotal + shippingCost : 0;

  const handleRemove = (item) => {
    removeFromCart(cartLineKey(item));
    trackRemoveFromCart(item, item.quantity);
  };

  const handleCheckoutClick = () => {
    trackBeginCheckout(cart, total);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] pt-24 pb-16 flex items-center justify-center text-[#171A20]">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DDD5] shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#F4F2ED] text-[#5A606A] flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 stroke-[1.5] text-[#8E7B56]" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#171A20] mb-3 tracking-tight">
              Your Shopping Cart is Empty
            </h1>
            <p className="text-[#5A606A] text-sm sm:text-base mb-8 leading-relaxed">
              Looks like you haven't added anything yet. Discover our flagship wireless audio devices and accessories.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="bg-[#171A20] hover:bg-[#0B0D10] active:scale-98 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4 text-[#B9A47C]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] pt-20 md:pt-24 pb-20 text-[#171A20]">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="py-6 border-b border-[#E2DDD5] mb-8">
          <div className="inline-flex items-center space-x-2 text-[#8E7B56] text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-white border border-[#E2DDD5] rounded-full">
            <span>Shopping Bag</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight">
            Order Review
          </h1>
          <p className="text-[#5A606A] text-sm mt-1">
            Review your selected items and proceed to secure cash on delivery checkout
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items Column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E2DDD5] shadow-xs divide-y divide-[#F4F2ED] overflow-hidden">
              {cart.map((item) => {
                const itemImg = item.thumbnail || item.images?.[0] || item.image || '/images/burhan_pro2_earbuds.jpg';
                const itemTotal = Number(item.price) * Number(item.quantity);

                return (
                  <div key={cartLineKey(item)} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">
                    {/* Image & Title */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F4F2ED] border border-[#E2DDD5] flex-shrink-0">
                        <Image
                          src={itemImg}
                          alt={item.name}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E7B56] mb-0.5">
                          {item.category || 'Official Product'}
                        </div>
                        <Link href={`/shop/${item.slug}`}>
                          <h3 className="font-heading text-sm sm:text-base font-bold text-[#171A20] hover:text-[#8E7B56] transition-colors truncate">
                            {item.name}
                          </h3>
                          {item.color && <p className="mt-1 text-sm font-semibold">Colour: {item.color}</p>}
                        </Link>
                        <div className="text-xs sm:text-sm font-semibold text-[#5A606A] mt-1">
                          PKR {Number(item.price).toLocaleString()} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Controls */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F4F2ED]">
                      {/* Stepper */}
                      <div className="flex items-center border border-[#D6D1C7] rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartLineKey(item), Math.max(1, item.quantity - 1))}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#171A20] hover:bg-[#F4F2ED] active:bg-[#EAE6DF] transition-colors font-bold text-sm"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-[#171A20]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartLineKey(item), Math.min(item.stock || 99, item.quantity + 1))}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#171A20] hover:bg-[#F4F2ED] active:bg-[#EAE6DF] transition-colors font-bold text-sm"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-24">
                        <div className="text-sm sm:text-base font-extrabold text-[#171A20]">
                          PKR {itemTotal.toLocaleString()}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name}${item.color ? ' ' + item.color : ''} from cart`}
                        className="text-[#A09D96] hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
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
                className="text-xs sm:text-sm font-semibold text-[#171A20] hover:text-[#8E7B56] transition-colors"
              >
                ← Continue Shopping
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-medium text-[#A09D96] hover:text-red-600 transition-colors"
              >
                Clear Entire Cart
              </button>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 border border-[#E2DDD5] shadow-xs space-y-5 sticky top-24">
              <h2 className="font-heading text-lg font-bold text-[#171A20] pb-3 border-b border-[#F4F2ED]">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#5A606A]">
                  <span>Subtotal ({getCartCount()} items)</span>
                  <span className="font-semibold text-[#171A20]">PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5A606A]">
                  <span>Estimated Delivery (confirmed at checkout)</span>
                  <span className="font-semibold text-[#171A20]">PKR {shippingCost.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-[#F4F2ED] flex justify-between items-baseline">
                  <span className="text-base font-bold text-[#171A20]">Payable Total</span>
                  <span className="text-2xl font-extrabold text-[#171A20] tracking-tight">
                    PKR {total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={handleCheckoutClick}
                className="w-full bg-[#171A20] hover:bg-[#0B0D10] active:scale-98 text-white font-bold py-4 rounded-xl text-base shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#B9A47C]" />
              </Link>

              {/* Trust Micro-signals */}
              <div className="pt-4 border-t border-[#F4F2ED] space-y-2.5 text-xs text-[#5A606A]">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-[#8E7B56] flex-shrink-0" />
                  <span>Estimated delivery: 2–5 business days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#8E7B56] flex-shrink-0" />
                  <span>Direct Store Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-[#8E7B56] flex-shrink-0" />
                  <span>7-Day Easy Replacement Policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
