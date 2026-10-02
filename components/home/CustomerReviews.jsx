'use client';

import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';

export default function CustomerReviews() {
  const reviews = [
    {
      name: 'Usman R.',
      city: 'Lahore',
      rating: 5,
      comment: 'The ANC on the BURHAN Pro 2 is unbelievable for this price. Metro bus travel is completely silent now. Fast delivery in 2 days to Gulberg.',
      product: 'BURHAN Pro 2',
      date: 'September 2026'
    },
    {
      name: 'Hamza Tariq',
      city: 'Karachi',
      rating: 5,
      comment: 'Audio latency in PUBG is basically non-existent in gaming mode. Microphone sound quality is crisp on regular and WhatsApp calls. 10/10.',
      product: 'BURHAN Pro 2',
      date: 'September 2026'
    },
    {
      name: 'Ayesha Malik',
      city: 'Islamabad',
      rating: 5,
      comment: 'Very premium packaging. The earbuds fit securely and do not fall out while running. Case wireless charging is so convenient.',
      product: 'BURHAN Pro 2',
      date: 'August 2026'
    },
    {
      name: 'Bilal Farooq',
      city: 'Faisalabad',
      rating: 5,
      comment: 'Open parcel allowed before payment gave me total peace of mind. Battery life is genuine 35+ hours with the case. Highly recommended!',
      product: 'BURHAN Pro 2',
      date: 'August 2026'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
            <span>Verified Customer Reviews</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-3">
            Trusted by Pakistani Audio Lovers
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Real feedback from customers across Lahore, Karachi, Islamabad, and nationwide who count on BURHAN for authentic tech.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">{rev.date}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">{rev.name}</div>
                    <div className="text-[11px] text-slate-500">{rev.city}, Pakistan</div>
                  </div>
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
