import { Suspense } from 'react';
import ShopContent from '@/components/shop/ShopContent';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const shopMetadata = {
  title: 'Shop All Electronics & Mobile Accessories',
  description: 'Browse our full collection of premium wireless earbuds, smartwatches, power banks, fast chargers, and gaming accessories at BURHAN STORE with nationwide cash on delivery across Pakistan.',
  alternates: {
    canonical: 'https://burhanstore.com/shop',
  },
  openGraph: {
    title: 'Shop All Electronics & Mobile Accessories | BURHAN STORE',
    description: 'Browse our full collection of premium wireless earbuds, smartwatches, power banks, and chargers with fast delivery across Pakistan.',
    url: 'https://burhanstore.com/shop',
    siteName: 'BURHAN STORE',
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop All Electronics & Mobile Accessories | BURHAN STORE',
    description: 'Browse premium wireless earbuds, smartwatches, power banks, and chargers with fast delivery in Pakistan.',
  },
};

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const filtered = Object.keys(params || {}).some(key => ['search', 'category', 'minPrice', 'maxPrice', 'sort', 'page'].includes(key));
  return { ...shopMetadata, robots: { index: !filtered, follow: true } };
}

export default function ShopPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://burhanstore.com' },
    { name: 'Shop', url: 'https://burhanstore.com/shop' },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Suspense
        fallback={
          <div className="min-h-screen bg-burhan-background pt-24 pb-12">
            <div className="container mx-auto px-4 text-center py-20">
              <div className="w-12 h-12 border-4 border-burhan-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-burhan-text-secondary">Loading products...</p>
            </div>
          </div>
        }
      >
        <ShopContent />
      </Suspense>
    </>
  );
}
