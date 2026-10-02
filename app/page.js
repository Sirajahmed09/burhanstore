import Hero from '@/components/home/Hero';
import FeaturedProduct from '@/components/home/FeaturedProduct';
import WhyBurhan from '@/components/home/WhyBurhan';
import BestSellers from '@/components/home/BestSellers';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import CustomerReviews from '@/components/home/CustomerReviews';
import WhatsAppCTA from '@/components/home/WhatsAppCTA';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: {
    absolute: 'BURHAN STORE | Premium Mobile Accessories & Electronics in Pakistan',
  },
  description: 'Discover authentic wireless earbuds, smartwatches, power banks, and fast chargers at BURHAN STORE with fast cash on delivery across Pakistan.',
  alternates: {
    canonical: 'https://burhanstore.com',
  },
  openGraph: {
    title: 'BURHAN STORE | Premium Mobile Accessories & Electronics in Pakistan',
    description: 'Discover authentic wireless earbuds, smartwatches, power banks, and fast chargers at BURHAN STORE with fast cash on delivery across Pakistan.',
    url: 'https://burhanstore.com',
    siteName: 'BURHAN STORE',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Hero */}
      <Hero />

      {/* 2. Flagship Featured Product (BURHAN Pro 2) */}
      <FeaturedProduct />

      {/* 3. Why BURHAN - Trust & Authenticity */}
      <WhyBurhan />

      {/* 4. Products / Collections */}
      <BestSellers />
      <FeaturedCategories />

      {/* 5. Customer Reviews */}
      <CustomerReviews />

      {/* 6. Final High-Conversion CTA & WhatsApp */}
      <WhatsAppCTA />
    </div>
  );
}
