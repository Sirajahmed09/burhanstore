/**
 * Structured Data Component for SEO
 * Generates JSON-LD for Organization, Website, and BreadcrumbList
 */

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Burhan Store",
    "alternateName": "Burhan",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com",
    "logo": `${process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com"}/logo.png`,
    "description": "Premium consumer electronics and mobile accessories in Pakistan",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK",
      "addressRegion": "Pakistan"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-315-0693148",
      "contactType": "customer service",
      "areaServed": "PK",
      "availableLanguage": ["en", "ur"]
    },
    "sameAs": [
      // Add social media links when available
      // "https://www.facebook.com/burhanstore",
      // "https://www.instagram.com/burhanstore",
      // "https://twitter.com/burhanstore"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Burhan Store",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com"}/shop?search={search_term_string}`
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

export function BreadcrumbSchema({ items }) {
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com";
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image || `${baseUrl}/placeholder.jpg`,
    "description": product.description || product.name,
    "sku": product._id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Burhan"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/shop/${product.slug}`,
      "priceCurrency": "PKR",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Burhan Store"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || 1,
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Burhan Store",
    "image": `${process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com"}/logo.png`,
    "@id": process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://burhanstore.com",
    "telephone": "+92-315-0693148",
    "priceRange": "PKR",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
