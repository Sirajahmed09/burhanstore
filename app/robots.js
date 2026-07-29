export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://burhanstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/checkout', '/success'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
