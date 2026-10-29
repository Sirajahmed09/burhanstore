// Owner requested publication of the original Pro 2's saved details on 2026-10-29.
// Explicit per-product settings always override this launch default; copies do not inherit it.
export function isOriginalPro2(product) {
  return product?._id === 'burhan-pro-2-flagship' && product?.slug === 'burhan-pro-2';
}

export function productDetailsPublished(product) {
  if (typeof product?.specificationsPublished === 'boolean') return product.specificationsPublished;
  return product?.specificationsVerified === true || isOriginalPro2(product);
}

const PRO2_SHORT = 'Your everyday sound, without the wires. BURHAN Pro 2 brings a compact design and charging case to your music, videos and daily routine.';
const PRO2_LONG = `YOUR EVERYDAY SOUND. THE BURHAN WAY.

Keep your favourite playlists, videos and podcasts close with BURHAN Pro 2 wireless earbuds. A clean design and compact charging case make them easy to keep with your everyday essentials.

AT YOUR DESK OR ON THE GO
Move from your daily routine to your downtime without tangled earphone wires. Keep your earbuds together in their case between listening sessions.

THE DETAILS THAT MATTER
Explore the specifications and package contents listed on this page to decide whether Pro 2 suits your needs. Need help with compatibility or choosing a product? Message BURHAN STORE before ordering.

STRAIGHTFORWARD SHOPPING
Your delivery charge is shown at checkout. For help after purchase, contact the store with your order number and issue details.`;

// Replace legacy generated launch copy, while keeping subsequent admin-written copy editable.
export function withProductEditorialDefaults(product) {
  if (!product || !isOriginalPro2(product)) return product;
  const next = { ...product };
  if (!next.shortDescription || /^(Balanced acoustic clarity,|Explore the available product and package details\.)/.test(next.shortDescription)) next.shortDescription = PRO2_SHORT;
  if (!next.description || /^(Experience balanced high-fidelity sound with BURHAN Pro 2\.|Explore the available product and package details\.)/.test(next.description)) next.description = PRO2_LONG;
  if (!next.seo?.title || /Active Noise Cancellation & Low-Latency Audio/.test(next.seo.title)) next.seo = { ...next.seo, title: 'BURHAN Pro 2 Wireless Earbuds | Buy Online in Pakistan', description: next.shortDescription };
  return next;
}
