import { notFound } from 'next/navigation';
import { getCollection } from '@/lib/db/mongodb';
import { ProductSchema, BreadcrumbSchema } from '@/components/seo/StructuredData';
import ProductDetailClient from '@/components/product/ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

async function getProductBySlug(slug) {
  try {
    const productsCol = await getCollection('products');
    const product = await productsCol.findOne({
      slug,
      status: { $nin: ['inactive', 'hidden', 'draft'] },
      isActive: { $ne: false }
    });
    return product;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

async function getRelatedProducts(product) {
  try {
    const productsCol = await getCollection('products');
    const query = {
      _id: { $ne: product._id },
      status: { $nin: ['inactive', 'hidden', 'draft'] },
      isActive: { $ne: false }
    };
    if (product.category) {
      query.category = product.category;
    }
    const related = await productsCol.find(query).limit(4).toArray();
    return related;
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | BURHAN STORE',
      description: 'The requested product is not available at BURHAN STORE.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${product.name} | Buy Online Pakistan`;
  const rawDescription = product.description || `Buy authentic ${product.name} online in Pakistan at BURHAN STORE with official warranty and fast cash on delivery.`;
  const description = rawDescription.length > 160 ? rawDescription.slice(0, 157).trim() + '...' : rawDescription;
  const canonicalUrl = `${BASE_URL}/shop/${product.slug}`;

  const rawImage = (Array.isArray(product.images) && product.images[0]) ||
    product.thumbnail ||
    product.image ||
    null;
  const ogImage = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`)
    : `${BASE_URL}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} - PKR ${Number(product.price).toLocaleString()} | BURHAN STORE`,
      description,
      url: canonicalUrl,
      siteName: 'BURHAN STORE',
      locale: 'en_PK',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: `${product.name} - BURHAN STORE`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | BURHAN STORE`,
      description,
      images: [ogImage],
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

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product);

  const plainProduct = serialize(product);
  const plainRelated = serialize(related);

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Shop', url: `${BASE_URL}/shop` },
  ];

  if (product.category) {
    const categorySlug = product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    breadcrumbs.push({
      name: product.category,
      url: `${BASE_URL}/category/${categorySlug}`
    });
  }

  breadcrumbs.push({
    name: product.name,
    url: `${BASE_URL}/shop/${product.slug}`
  });

  return (
    <>
      <ProductSchema product={plainProduct} />
      <BreadcrumbSchema items={breadcrumbs} />
      <ProductDetailClient
        product={plainProduct}
        initialRelated={plainRelated}
      />
    </>
  );
}
