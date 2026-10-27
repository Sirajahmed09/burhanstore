// Keep retired store claims and private fields out of all public product surfaces.
export function cleanStoreCopy(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/(?:official\s+)?6[- ]months?\s+(?:store\s+)?(?:replacement\s+)?warranty\*?(?:\s*\([^)]*\))?/gi, 'direct store support')
    .replace(/(?:100%\s+)?authentic\b/gi, '')
    .replace(/verified authenticity/gi, 'direct store support')
    .replace(/express\s+(delivery|shipping|courier)/gi, '$1')
    .replace(/1\s*[-–]\s*3\s*(business\s*)?days/gi, '2–5 business days')
    .replace(/\s{2,}/g, ' ').trim();
}
function cleanContent(value) {
  if (typeof value === 'string') return cleanStoreCopy(value);
  if (Array.isArray(value)) return value.map(cleanContent);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, content]) => [key, cleanContent(content)]));
  return value;
}
export function publicProduct(product) {
  if (!product) return null;
  const { costPrice, adminNotes, internalMargin, createdBy, warranty, ...safe } = product;
  for (const key of ['description', 'shortDescription', 'highlights', 'features', 'inBox', 'seo', 'deliveryInfo']) {
    if (safe[key]) safe[key] = cleanContent(safe[key]);
  }
  if (safe.specifications) {
    safe.specifications = Array.isArray(safe.specifications)
      ? safe.specifications.filter(item => !/warranty|authentic/i.test(item.key || '')).map(cleanContent)
      : Object.fromEntries(Object.entries(safe.specifications).filter(([key]) => !/warranty|authentic/i.test(key)).map(([key, value]) => [key, cleanContent(value)]));
  }
  if (Array.isArray(safe.faqs)) safe.faqs = safe.faqs.filter(faq => !/warranty|authentic/i.test(faq.question || '')).map(cleanContent);
  // Performance and comparison claims stay hidden until the owner confirms them.
  if (safe.specificationsVerified !== true) {
    safe.shortDescription = 'Explore the available product and package details. Message our store if you would like anything confirmed before ordering.';
    safe.description = safe.shortDescription;
    safe.highlights = [];
    safe.features = [];
    safe.specifications = {};
    safe.inBox = [];
    safe.seo = { ...(safe.seo || {}), description: safe.shortDescription };
    safe.faqs = (safe.faqs || []).filter(faq => !/battery|playback|latency|gaming|pubg|anc|noise|wireless charg|water|open.*parcel/i.test(faq.question || '')).map(faq => ({ ...faq, answer: /cash on delivery/i.test(faq.question || '') ? 'Cash on Delivery is available where our courier serves. Your delivery charge is shown at checkout.' : faq.answer }));
  }
  if (safe.compareAtPriceVerified !== true) {
    safe.oldPrice = null;
    safe.discount = 0;
  }
  if (safe.reviewsVerified !== true) {
    safe.rating = 0;
    safe.reviewCount = 0;
  }
  return safe;
}
