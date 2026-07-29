'use client';

import Hero from '@/components/home/Hero';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import WhyBurhan from '@/components/home/WhyBurhan';
import CustomerReviews from '@/components/home/CustomerReviews';
import WhatsAppCTA from '@/components/home/WhatsAppCTA';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedCategories />
      <BestSellers />
      <WhyBurhan />
      <CustomerReviews />
      <WhatsAppCTA />
    </div>
  );
}
