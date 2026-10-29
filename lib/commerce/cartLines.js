import { cartLineKey, cartProduct } from './colourVariants.js';

export function addCartLine(cart, product, quantity = 1) {
  let selected;
  try { selected = cartProduct(product); } catch { return cart; }
  const stock = Math.max(0, Number(selected.stock) || 0);
  const existing = cart.find(item => cartLineKey(item) === selected.cartKey);
  const otherUnits = cart.filter(item => item._id === selected._id && cartLineKey(item) !== selected.cartKey).reduce((sum, item) => sum + item.quantity, 0);
  const available = Math.max(0, stock - otherUnits);
  const nextQuantity = Math.min(available, (existing?.quantity || 0) + Math.max(1, Math.floor(Number(quantity) || 1)));
  if (!nextQuantity) return cart;
  if (existing) return cart.map(item => cartLineKey(item) === selected.cartKey ? { ...selected, quantity: nextQuantity } : item);
  return [...cart, { ...selected, quantity: nextQuantity }];
}

export function updateCartLine(cart, key, quantity) {
  const selected = cart.find(item => cartLineKey(item) === key);
  if (!selected) return cart;
  const others = cart.filter(item => item._id === selected._id && cartLineKey(item) !== key).reduce((sum, item) => sum + item.quantity, 0);
  const next = Math.max(0, Math.min(Math.floor(Number(quantity) || 0), (Number(selected.stock) || 0) - others));
  if (!next) return cart.filter(item => cartLineKey(item) !== key);
  return cart.map(item => cartLineKey(item) === key ? { ...item, quantity: next } : item);
}
