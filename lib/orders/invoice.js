// Only these sender fields are returned alongside authenticated order details.
export function invoiceSenderFromSettings(settings = {}) {
  return {
    name: String(settings.invoiceSenderName || settings.businessName || 'BURHAN STORE').trim(),
    phone: String(settings.invoiceSenderPhone || settings.phone || '').trim(),
    address: String(settings.invoiceSenderAddress || '').trim(),
  };
}

export function invoicePrintIssue(order, sender) {
  if (!sender?.name || !sender?.phone || !sender?.address) return 'Set the parcel sender name, phone and full return address in Settings before printing.';
  if (!order?.customer?.name || !order?.customer?.phone || !order?.customer?.address || !order?.customer?.city) return 'The delivery name, phone, street address and city must be complete before printing.';
  return '';
}

export function invoicePayment(order = {}) {
  const total = Math.max(0, Number(order.total) || 0);
  const paid = ['paid', 'completed', 'succeeded'].includes(String(order.paymentStatus || '').toLowerCase());
  return { total, collect: order.paymentMethod === 'cod' && !paid ? total : null, paid };
}
