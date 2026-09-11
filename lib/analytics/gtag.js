// Google Analytics 4 tracking helpers for Burhan Store

export const GA_MEASUREMENT_ID = 'G-5VFLTW4L36';

/**
 * Global safe gtag invoker
 */
export function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/**
 * Track route changes / page views
 */
export function pageView(url) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Generic GA4 event
 */
export function trackEvent(action, params = {}) {
  gtag('event', action, params);
}

/**
 * E-commerce: view_item_list
 */
export function trackViewItemList(items = [], listName = 'Product Catalog') {
  if (!Array.isArray(items) || items.length === 0) return;
  gtag('event', 'view_item_list', {
    item_list_name: listName,
    items: items.slice(0, 20).map((product, index) => ({
      item_id: String(product._id || product.id || product.sku || ''),
      item_name: product.name || 'Product',
      item_category: product.category || 'General',
      price: Number(product.price) || 0,
      index: index + 1,
    })),
  });
}

/**
 * E-commerce: view_item
 */
export function trackViewItem(product) {
  if (!product) return;
  gtag('event', 'view_item', {
    currency: 'PKR',
    value: Number(product.price) || 0,
    items: [
      {
        item_id: String(product._id || product.id || product.sku || ''),
        item_name: product.name || 'Product',
        item_category: product.category || 'General',
        price: Number(product.price) || 0,
        quantity: 1,
      },
    ],
  });
}

/**
 * E-commerce: add_to_cart
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const qty = Number(quantity) || 1;
  const price = Number(product.price) || 0;
  gtag('event', 'add_to_cart', {
    currency: 'PKR',
    value: price * qty,
    items: [
      {
        item_id: String(product._id || product.id || product.sku || ''),
        item_name: product.name || 'Product',
        item_category: product.category || 'General',
        price: price,
        quantity: qty,
      },
    ],
  });
}

/**
 * E-commerce: remove_from_cart
 */
export function trackRemoveFromCart(product, quantity = 1) {
  if (!product) return;
  const qty = Number(quantity) || 1;
  const price = Number(product.price) || 0;
  gtag('event', 'remove_from_cart', {
    currency: 'PKR',
    value: price * qty,
    items: [
      {
        item_id: String(product._id || product.id || product.sku || ''),
        item_name: product.name || 'Product',
        item_category: product.category || 'General',
        price: price,
        quantity: qty,
      },
    ],
  });
}

/**
 * E-commerce: begin_checkout
 */
export function trackBeginCheckout(cart = [], totalValue = 0) {
  if (!Array.isArray(cart) || cart.length === 0) return;
  gtag('event', 'begin_checkout', {
    currency: 'PKR',
    value: Number(totalValue) || 0,
    items: cart.map((item) => ({
      item_id: String(item._id || item.productId || ''),
      item_name: item.name || 'Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    })),
  });
}

/**
 * E-commerce: purchase
 * Strictly only fires with real backend-verified order details
 */
export function trackPurchase(order) {
  if (!order || !order._id) return;
  const orderId = String(order._id);
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        item_id: String(item.productId || item._id || ''),
        item_name: item.name || 'Product',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
      }))
    : [];

  gtag('event', 'purchase', {
    transaction_id: orderId,
    value: Number(order.total) || 0,
    currency: 'PKR',
    tax: Number(order.tax || 0),
    shipping: Number(order.shipping || 200),
    items: items,
  });
}

/**
 * Search tracking
 */
export function trackSearch(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') return;
  gtag('event', 'search', {
    search_term: searchTerm.trim(),
  });
}

/**
 * Login tracking
 */
export function trackLogin(method = 'credentials') {
  gtag('event', 'login', {
    method,
  });
}
