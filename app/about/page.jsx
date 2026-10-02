'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Award, Headphones, TrendingUp, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: ShieldCheck,
      title: 'Authenticity Guarantee',
      description: 'We strictly sell certified original devices with official 1-year replacement warranty. No fakes or grey imports.'
    },
    {
      icon: Truck,
      title: 'Nationwide Delivery',
      description: 'Reliable express courier delivery to 150+ cities across Pakistan with cash on delivery at your doorstep.'
    },
    {
      icon: Headphones,
      title: 'Dedicated Human Support',
      description: 'Personalized customer service via WhatsApp and phone to guide your purchase and assist with claims.'
    },
    {
      icon: Award,
      title: 'Pakistani Engineering Standard',
      description: 'Carefully curated tech hardware tested for durability in local climate, voltage stability, and daily usage.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-20 text-slate-900">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center py-8 border-b border-slate-200/80 mb-10">
          <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
            <span>About BURHAN STORE</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-3">
            Powering Your Digital Lifestyle
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Delivering authentic audio, smart gadgets, and mobile electronics across Pakistan with verified quality and honest service.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-10 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h2 className="font-heading text-2xl font-bold text-slate-950 mb-3">
            Our Mission & Philosophy
          </h2>
          <p>
            BURHAN was founded with a clear mission: to eliminate the uncertainty and counterfeit products that often frustrate electronics shoppers in Pakistan. We believe everyone deserves high-fidelity audio and dependable mobile accessories at fair, accessible prices.
          </p>
          <p>
            Our flagship <strong>BURHAN Pro 2</strong> is the culmination of customer feedback — pairing active noise cancellation, low gaming latency, and multi-day battery endurance into an ergonomic design built for Pakistani commuters, gamers, and professionals.
          </p>
          <p>
            From our Karachi distribution hub to remote towns across Sindh, Punjab, KPK, Balochistan, and Gilgit-Baltistan, we back every product with open-parcel verification and 1-year warranty coverage.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-slate-950 mb-6 text-center">
            Our Core Promises
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((val, idx) => {
              const IconComp = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 border border-cyan-100">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-950 mb-1.5">
                    {val.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 text-center shadow-md">
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold mb-3">
            Experience the BURHAN Difference
          </h3>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Join thousands of satisfied Pakistani customers enjoying authentic audio with full warranty protection.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 font-bold px-7 py-3.5 rounded-xl text-sm transition-all"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
