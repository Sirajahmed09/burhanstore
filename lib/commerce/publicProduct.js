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
  return safe;
}
