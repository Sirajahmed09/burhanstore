'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw, Headphones, PackageCheck, CheckCircle2 } from 'lucide-react';

export default function WhyBurhan() {
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: '1-Year Official Warranty',
      description: '100% authentic devices with manufacturer-backed replacement warranty. No copies, no refurbished units.'
    },
    {
      icon: Truck,
      title: 'Nationwide Cash on Delivery',
      description: 'Reliable doorstep delivery via TCS, Leopards, and Call Courier across 150+ cities in Pakistan.'
    },
    {
      icon: PackageCheck,
      title: 'Open Parcel Verification',
      description: 'Check your package on delivery for complete confidence before payment. Absolute transparency.'
    },
    {
      icon: Headphones,
      title: 'Direct WhatsApp Support',
      description: 'Instant human assistance for setup, inquiries, and warranty claims from our Karachi service team.'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
            <span>Why Choose BURHAN</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-3">
            Built on Trust, Quality & Service
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            We eliminate the uncertainties of online electronics shopping in Pakistan with verified authenticity and full warranty coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item, index) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 border border-cyan-100">
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-950 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
