export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/cart',
          '/checkout',
          '/success',
          '/wishlist',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
