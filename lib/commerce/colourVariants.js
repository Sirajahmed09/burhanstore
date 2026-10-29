import { isOriginalPro2 } from './productPublishing.js';

const validPrice = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1000000 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;

export function validateColourVariants(variants) {
  if (!Array.isArray(variants) || variants.length > 12) return 'Use at most 12 colour options.';
  const ids = new Set(); const names = new Set();
  for (const variant of variants) {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant) || typeof variant.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(variant.id)) return 'Each colour needs a valid unique ID.';
    if (typeof variant.color !== 'string' || !variant.color.trim() || variant.color.trim().length > 40) return 'Each colour needs a name of up to 40 characters.';
    const name = variant.color.trim().toLowerCase();
    if (ids.has(variant.id) || names.has(name)) return 'Colour names and IDs must be unique.';
    ids.add(variant.id); names.add(name);
    if (typeof variant.enabled !== 'boolean' || typeof variant.useBasePrice !== 'boolean') return 'Check the colour availability and price settings.';
    if (!variant.useBasePrice && variant.enabled && !validPrice(variant.price)) return `Set a valid final price for ${variant.color}, or mark it unavailable.`;
    if (variant.price != null && !validPrice(variant.price)) return `Invalid price for ${variant.color}.`;
  }
  return null;
}

export function getColourVariants(product) {
  const stored = Array.isArray(product?.variants) && product.variants.length ? product.variants : null;
  const variants = stored || (isOriginalPro2(product) ? [
    { id: 'white', color: 'White', useBasePrice: true, price: null, enabled: true },
    { id: 'black', color: 'Black', useBasePrice: false, price: null, enabled: false },
  ] : []);
  return variants.filter(v => v && typeof v.id === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(v.id) && typeof v.color === 'string').map(v => ({
    id: v.id, color: v.color.trim().slice(0, 40), useBasePrice: v.useBasePrice === true,
    price: validPrice(v.price) ? v.price : null,
    enabled: v.enabled === true && (v.useBasePrice === true ? validPrice(Number(product?.basePrice ?? product?.price)) : validPrice(v.price)),
  }));
}

export function resolveColourSelection(product, variantId = '') {
  if (typeof variantId !== 'string' || (variantId && !/^[a-z0-9][a-z0-9_-]{0,39}$/.test(variantId))) throw Object.assign(new Error('Please select a valid colour.'), { status: 400 });
  const variants = getColourVariants(product);
  const variant = variantId ? variants.find(v => v.id === variantId) : variants.find(v => v.enabled);
  if ((variants.length && (!variant || !variant.enabled)) || (!variants.length && variantId)) throw Object.assign(new Error('The selected colour is currently unavailable. Please review your cart.'), { status: 409 });
  const price = variant && !variant.useBasePrice ? variant.price : Number(product.basePrice ?? product.price);
  if (!validPrice(price)) throw Object.assign(new Error('Product price is unavailable. Please contact our store.'), { status: 409 });
  return { variantId: variant?.id || '', color: variant?.color || '', price };
}

export function cartLineKey(item) {
  return JSON.stringify([String(item.productId || item._id || ''), item.variantId || '']);
}

export function cartProduct(product, variantId = product?.variantId || '') {
  if (!product) return null;
  const selection = resolveColourSelection(product, variantId);
  const item = { ...product, basePrice: Number(product.basePrice ?? product.price), ...selection };
  return { ...item, cartKey: cartLineKey(item) };
}

export function colourPriceRange(product) {
  const variants = getColourVariants(product).filter(variant => variant.enabled);
  const prices = variants.map(variant => { try { return resolveColourSelection(product, variant.id).price; } catch { return null; } }).filter(price => price !== null);
  if (!prices.length) prices.push(Number(product?.price) || 0);
  return { low: Math.min(...prices), high: Math.max(...prices), count: variants.length };
}
