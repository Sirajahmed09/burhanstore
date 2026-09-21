import { getCollection } from '@/lib/db/mongodb';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

  try {
    // Get all active, visible products
    const productsCol = await getCollection('products');
    const products = await productsCol.find({
      status: { $nin: ['inactive', 'hidden', 'draft'] },
      isActive: { $ne: false }
    }).toArray();

    // Get all categories
    const categoriesCol = await getCollection('categories');
    const categories = await categoriesCol.find({}).toArray();

    // Static pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/shop`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/cart`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/track`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/refund`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ];

    // Product pages
    const productPages = products.map((product) => ({
      url: `${baseUrl}/shop/${product.slug}`,
      lastModified: product.updatedAt || product.createdAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Category pages
    const categoryPages = categories.map((category) => ({
      url: `${baseUrl}/shop?category=${encodeURIComponent(category.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
