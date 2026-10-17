/**
 * Canonical order lifecycle rules.
 *
 * Keep status changes in one place so callers cannot accidentally skip a
 * fulfillment step or move a completed order back into fulfillment.
 */

export const ORDER_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'refunded'
]);

export const ALLOWED_ORDER_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['confirmed', 'cancelled']),
  confirmed: Object.freeze(['processing', 'cancelled']),
  processing: Object.freeze(['packed', 'cancelled']),
  packed: Object.freeze(['shipped', 'cancelled']),
  shipped: Object.freeze(['delivered']),
  delivered: Object.freeze(['returned']),
  returned: Object.freeze(['refunded']),
  cancelled: Object.freeze([]),
  refunded: Object.freeze([])
});

const STATUS_SET = new Set(ORDER_STATUSES);

export function isValidOrderStatus(status) {
  return typeof status === 'string' && STATUS_SET.has(status);
}

/**
 * Return whether an order can move from one status to another.
 * Same-status writes are intentionally not transitions; callers should avoid
 * creating duplicate timeline entries for an unchanged status.
 */
export function canTransitionOrderStatus(fromStatus, toStatus) {
  if (!isValidOrderStatus(fromStatus) || !isValidOrderStatus(toStatus)) {
    return false;
  }

  return ALLOWED_ORDER_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getAllowedOrderTransitions(status) {
  if (!isValidOrderStatus(status)) return [];
  return [...ALLOWED_ORDER_TRANSITIONS[status]];
}

/**
 * Validate a requested transition without throwing, which is convenient for
 * route handlers and form/API validation.
 */
export function validateOrderStatusTransition(fromStatus, toStatus) {
  const valid = canTransitionOrderStatus(fromStatus, toStatus);

  return {
    valid,
    fromStatus,
    toStatus,
    error: valid
      ? null
      : `Order cannot transition from ${String(fromStatus)} to ${String(toStatus)}`
  };
}
