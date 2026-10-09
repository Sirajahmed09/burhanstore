import { getCollection } from '@/lib/db/mongodb';
import Hero from '@/components/home/Hero';
import FeaturedProduct from '@/components/home/FeaturedProduct';
import WhyBurhan from '@/components/home/WhyBurhan';
import BestSellers from '@/components/home/BestSellers';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import WhatsAppCTA from '@/components/home/WhatsAppCTA';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: {
    absolute: 'BURHAN STORE | Premium Audio & Mobile Tech in Pakistan',
  },
  description: 'Shop authentic BURHAN Pro 2 Wireless Earbuds, audio gear, and mobile accessories with nationwide cash on delivery, open parcel verification, and 6-month store replacement warranty.',
  alternates: {
    canonical: 'https://burhanstore.com',
  },
  openGraph: {
    title: 'BURHAN STORE | Premium Audio & Mobile Tech in Pakistan',
    description: 'Shop authentic BURHAN Pro 2 Wireless Earbuds, audio gear, and mobile accessories with nationwide cash on delivery, open parcel verification, and 6-month store replacement warranty.',
    url: 'https://burhanstore.com',
    siteName: 'BURHAN STORE',
    locale: 'en_PK',
    type: 'website',
  },
};

async function getHomepageProducts() {
  try {
    const productsCol = await getCollection('products');
    const ACTIVE_FILTER = {
      status: { $nin: ['inactive', 'hidden', 'draft'] },
      isActive: { $ne: false },
      visible: { $ne: false }
    };
    const products = await productsCol.find(ACTIVE_FILTER).toArray();
    return JSON.parse(JSON.stringify(products));
  } catch (err) {
    console.error('Failed to load active products for homepage:', err);
    return [];
  }
}

export default async function Home() {
  const activeProducts = await getHomepageProducts();

  // Find BURHAN Pro 2 or primary active product
  const flagship = activeProducts.find(p => p.name === 'BURHAN Pro 2') || activeProducts[0] || null;
  // Other active products (excluding the flagship so it is not shown twice)
  const additionalProducts = activeProducts.filter(p => p._id !== flagship?._id);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 1. Premium 3D-Style Headphone Hero with Dynamic Flagship Product Data */}
      <Hero flagshipProduct={flagship} />

      {/* 2. Flagship In-Depth Showcase (BURHAN Pro 2) */}
      {flagship && <FeaturedProduct initialProduct={flagship} />}

      {/* 3. Verified Store Trust & Service Pillars */}
      <WhyBurhan />

      {/* 4. Additional Active Products (Only renders if other products are active) */}
      {additionalProducts.length > 0 && <BestSellers products={additionalProducts} />}

      {/* 5. Curated Hardware Collections */}
      <FeaturedCategories />

      {/* 6. Official WhatsApp & Customer Concierge */}
      <WhatsAppCTA />
    </div>
  );
}
