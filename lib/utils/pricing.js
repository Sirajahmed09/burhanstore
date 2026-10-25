/**
 * Pricing & Discount Integrity Utilities for BURHAN STORE.
 *
 * Rules:
 * - A discount badge or percentage is ONLY shown when oldPrice > price > 0.
 * - If oldPrice <= price, missing, or negative, discount is strictly 0.
 * - Never returns fabricated or arbitrary discounts.
 */

export function calculateValidDiscount(price, oldPrice) {
  const numPrice = Number(price);
  const numOldPrice = Number(oldPrice);

  if (!Number.isFinite(numPrice) || !Number.isFinite(numOldPrice)) {
    return 0;
  }

  if (numPrice <= 0 || numOldPrice <= 0) {
    return 0;
  }

  if (numOldPrice <= numPrice) {
    return 0;
  }

  const rawPercent = ((numOldPrice - numPrice) / numOldPrice) * 100;
  const rounded = Math.round(rawPercent);

  // Must be between 1% and 99%
  return rounded > 0 && rounded < 100 ? rounded : 0;
}

export function formatPricePKR(amount) {
  const num = Number(amount) || 0;
  return `PKR ${num.toLocaleString()}`;
}
