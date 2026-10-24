/**
 * Canonical validator to verify whether an existing persisted order matches
 * a new incoming order attempt using the same clientReferenceId.
 *
 * Prevents key-hijacking and cross-customer collisions:
 * - Checks normalized customer phone, name, city, address
 * - Checks exact item IDs and quantities
 * - Checks server-calculated subtotal and total
 */
export function areOrdersPayloadCompatible(existingOrder, incomingOrder) {
  if (!existingOrder || !incomingOrder) return false;

  // 1. Customer verification (phone, name, city, address)
  const cleanPhone = (p) => String(p || '').replace(/[^0-9]/g, '').slice(-10);
  const existingPhone = cleanPhone(existingOrder.customer?.phone);
  const incomingPhone = cleanPhone(incomingOrder.customer?.phone);
  if (existingPhone !== incomingPhone || !existingPhone) return false;

  const normalizeStr = (s) => String(s || '').trim().toLowerCase();
  if (normalizeStr(existingOrder.customer?.name) !== normalizeStr(incomingOrder.customer?.name)) return false;
  if (normalizeStr(existingOrder.customer?.city) !== normalizeStr(incomingOrder.customer?.city)) return false;
  if (normalizeStr(existingOrder.customer?.address) !== normalizeStr(incomingOrder.customer?.address)) return false;

  // 2. Items verification (IDs and quantities)
  const existingItems = Array.isArray(existingOrder.items) ? existingOrder.items : [];
  const incomingItems = Array.isArray(incomingOrder.items) ? incomingOrder.items : [];
  if (existingItems.length !== incomingItems.length) return false;

  const sortKey = (item) => `${String(item.productId)}:${item.quantity}`;
  const existingKeys = existingItems.map(sortKey).sort().join('|');
  const incomingKeys = incomingItems.map(sortKey).sort().join('|');
  if (existingKeys !== incomingKeys) return false;

  // 3. Financial consistency (server-calculated subtotal and total)
  if (Number(existingOrder.subtotal) !== Number(incomingOrder.subtotal)) return false;
  if (Number(existingOrder.total) !== Number(incomingOrder.total)) return false;

  return true;
}
