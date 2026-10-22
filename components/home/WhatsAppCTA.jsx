'use client';

import { MessageCircle, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppCTA() {
  const whatsappNumber = '03150693148';
  const message = 'Hello BURHAN STORE! I would like to order BURHAN Pro 2 / inquire about your products.';

  return (
    <section className="py-16 md:py-20 bg-[#0B0D10] text-white relative overflow-hidden border-t border-white/10">
      <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#B9A47C] text-xs font-bold uppercase tracking-wider mb-3 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <span>Personal Customer Concierge</span>
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
          Need Help Choosing or Placing an Order?
        </h2>

        <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Chat directly with our support team on WhatsApp for order assistance, express delivery tracking, and technical inquiries.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-[#0B0D10] px-8 py-4 rounded-xl font-bold text-base transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <MessageCircle className="w-5 h-5 fill-[#0B0D10]" />
            <span>Chat on WhatsApp (0315-0693148)</span>
          </a>

          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 active:scale-98 text-white px-7 py-4 rounded-xl font-semibold text-base transition-colors border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4 text-[#B9A47C]" />
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center items-center gap-6 text-xs text-white/60">
          <span className="flex items-center space-x-1.5">
            <Truck className="w-4 h-4 text-[#B9A47C]" />
            <span>Express Delivery Across Pakistan</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#B9A47C]" />
            <span>6-Month Replacement Warranty* (Terms Apply)</span>
          </span>
        </div>
      </div>
    </section>
  );
}
