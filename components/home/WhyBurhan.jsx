'use client';

import { ShieldCheck, Truck, Headphones, PackageCheck } from 'lucide-react';

export default function WhyBurhan() {
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'Direct Store Support',
      description: 'Ask us about product details before buying and get help with your order afterwards.'
    },
    {
      icon: Truck,
      title: 'Nationwide Cash on Delivery',
      description: 'Estimated delivery in 2–5 business days, depending on location and courier coverage.'
    },
    {
      icon: PackageCheck,
      title: 'Delivery Guidance',
      description: 'Confirm delivery and parcel inspection options with us before ordering; courier policies vary.'
    },
    {
      icon: Headphones,
      title: 'Direct WhatsApp Support',
      description: 'Message our Karachi store for product questions, order updates, and after-sales help.'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F4F2ED] border-b border-[#E2DDD5]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 text-[#8E7B56] text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-white border border-[#E2DDD5] rounded-full">
            <span>Why Choose BURHAN</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#171A20] tracking-tight mb-3">
            Built on Trust, Quality & Service
          </h2>
          <p className="text-[#5A606A] text-sm sm:text-base leading-relaxed">
            Shop with clear delivery charges, Cash on Delivery, and direct access to our support.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-[#E2DDD5] shadow-xs hover:border-[#D6D1C7] transition-all flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F4F2ED] text-[#171A20] flex items-center justify-center mb-4 border border-[#E2DDD5]">
                  <IconComp className="w-6 h-6 text-[#8E7B56]" />
                </div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#171A20] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5A606A] leading-relaxed">
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
