import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCollection } from '@/lib/db/mongodb';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import ProductCard from '@/components/product/ProductCard';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

async function getCategoryBySlug(slug) {
  try {
    const categoriesCol = await getCollection('categories');
    // Try matching slug, or generate matching slug from name
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
    <div className="min-h-screen bg-burhan-background pt-24 pb-12">
      <BreadcrumbSchema items={breadcrumbs} />
      <div className="container mx-auto px-4">
        {/* Breadcrumb Navigation Bar */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-burhan-text-secondary">
            <li>
              <Link href="/" className="hover:text-burhan-primary transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/shop" className="hover:text-burhan-primary transition-colors">
                Shop
              </Link>
            </li>
            <li>/</li>
            <li className="text-burhan-primary font-semibold" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-burhan-primary mb-3">
            {category.name}
          </h1>
          <p className="text-burhan-text-secondary text-lg max-w-3xl">
            {category.description || `Browse our curated collection of ${category.name.toLowerCase()} at BURHAN STORE. Authentic products with nationwide delivery in Pakistan.`}
          </p>
          <div className="mt-4 text-sm font-semibold text-burhan-secondary">
            {products.length} {products.length === 1 ? 'Product' : 'Products'} available
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center my-8">
            <h2 className="font-heading text-2xl font-bold text-burhan-primary mb-3">
              No products found in this category yet
            </h2>
            <p className="text-burhan-text-secondary mb-6">
              Check back soon for new arrivals or browse our full shop catalog.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-burhan-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
