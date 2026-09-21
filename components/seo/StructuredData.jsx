/**
 * Structured Data Component for SEO
 * Generates JSON-LD for Organization, Website, BreadcrumbList, and Product
 */

export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": "BURHAN STORE",
    "alternateName": "Burhan",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Pakistan-focused online store for premium mobile accessories and electronics.",
    "email": "infoburhancommunication@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Karachi",
      "addressRegion": "Sindh",
      "addressCountry": "PK"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-301-3301830",
      "contactType": "customer service",
      "areaServed": "PK",
      "availableLanguage": ["en", "ur"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BURHAN STORE",
    "alternateName": "Burhan Store Pakistan",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/shop?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductSchema({ product }) {
  if (!product) return null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com";

  const rawImage = (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
    product.thumbnail ||
    product.image ||
    null;

  const imageUrl = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`)
    : `${baseUrl}/og-image.jpg`;

  const productUrl = `${baseUrl}/shop/${product.slug}`;
  const price = Number(product.price) || 0;
  const inStock = typeof product.stock === 'number' ? product.stock > 0 : true;

  const hasValidRatings = typeof product.rating === 'number' &&
    product.rating > 0 &&
    typeof product.reviewCount === 'number' &&
    product.reviewCount > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": imageUrl,
    "description": product.description || `${product.name} available at BURHAN STORE.`,
    "sku": product.sku ? String(product.sku) : String(product._id || ''),
    "brand": {
      "@type": "Brand",
      "name": product.brand || "BURHAN STORE"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "PKR",
      "price": price,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "BURHAN STORE"
      }
    },
    ...(hasValidRatings ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    } : {})
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

