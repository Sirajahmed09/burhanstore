import Hero from '@/components/home/Hero';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import WhyBurhan from '@/components/home/WhyBurhan';
import CustomerReviews from '@/components/home/CustomerReviews';
import WhatsAppCTA from '@/components/home/WhatsAppCTA';

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

