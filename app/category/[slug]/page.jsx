import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCollection } from '@/lib/db/mongodb';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import ProductCard from '@/components/product/ProductCard';
import { PackageOpen, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

async function getCategoryBySlug(slug) {
  try {
    const categoriesCol = await getCollection('categories');
    const category = await categoriesCol.findOne({
      $or: [
        { slug: slug },
        { slug: slug.toLowerCase() },
        { name: new RegExp(`^${slug.replace(/-/g, ' ')}$`, 'i') }
      ]
    });
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getProductsByCategory(categoryName) {
  try {
    const productsCol = await getCollection('products');
    const products = await productsCol.find({
      category: categoryName,
      status: { $nin: ['inactive', 'hidden', 'draft'] },
      isActive: { $ne: false }
    }).toArray();
    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found | BURHAN STORE',
      description: 'The requested category is not available at BURHAN STORE.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${category.name} | Mobile Accessories & Electronics`;
  const rawDescription = category.description || `Shop authentic ${category.name.toLowerCase()} in Pakistan at BURHAN STORE. Discover premium quality, official warranty, and fast cash on delivery.`;
  const description = rawDescription.length > 160 ? rawDescription.slice(0, 157).trim() + '...' : rawDescription;
  const canonicalUrl = `${BASE_URL}/category/${category.slug || slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'BURHAN STORE',
      locale: 'en_PK',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${category.name} - BURHAN STORE`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const rawProducts = await getProductsByCategory(category.name);
  const products = serialize(rawProducts);

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Shop', url: `${BASE_URL}/shop` },
    { name: category.name, url: `${BASE_URL}/category/${category.slug || slug}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-16 text-slate-900">
      <BreadcrumbSchema items={breadcrumbs} />
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb Navigation Bar */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 py-3 mb-4 flex items-center space-x-2">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-slate-900 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate" aria-current="page">
            {category.name}
          </span>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/80 shadow-xs mb-8">
          <div className="inline-flex items-center space-x-2 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 bg-cyan-50 border border-cyan-200/70 rounded-md">
            <span>Category Collection</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight mb-3">
            {category.name}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            {category.description || `Browse authentic ${category.name.toLowerCase()} at BURHAN STORE with official 1-year warranty and fast nationwide cash on delivery across Pakistan.`}
          </p>
          <div className="mt-4 text-xs sm:text-sm font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{products.length}</strong> available item{products.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-950 mb-2">
              No products active in this category right now
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              New inventory is arriving soon. In the meantime, explore our flagship BURHAN Pro 2 or browse the complete shop.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
