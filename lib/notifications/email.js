/**
 * Server-side transactional email notifications.
 *
 * This module deliberately has no dependency on route or persistence code. Every
 * public send function returns an outcome, including configuration, validation,
 * network, and provider errors, so email delivery cannot abort an order write.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const EMAIL_TYPES = new Set(['order_confirmation', 'status', 'shipment', 'delivery']);

export function getEmailConfiguration(env = process.env) {
  const provider = String(env.EMAIL_PROVIDER || '').trim().toLowerCase();
  const apiKey = String(env.RESEND_API_KEY || '').trim();
  const from = String(env.EMAIL_FROM || '').trim();

  return {
    provider,
    apiKey,
    from,
    isConfigured: provider === 'resend' && Boolean(apiKey && from),
  };
}

export function isValidEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return false;
  // Practical application-level validation; provider performs final mailbox checks.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function createNotificationDedupeKey({ orderId, type, recipient }) {
  const normalizedOrderId = String(orderId || '').trim();
  const normalizedType = String(type || '').trim().toLowerCase();
  const normalizedRecipient = String(recipient || '').trim().toLowerCase();
  if (!normalizedOrderId || !normalizedType || !normalizedRecipient) return null;
  return `email:${normalizedType}:${normalizedOrderId}:${normalizedRecipient}`;
}

/** A filter suitable for a MongoDB notification/outbox collection. */
export function buildNotificationDedupeFilter({ orderId, type, recipient }) {
  const dedupeKey = createNotificationDedupeKey({ orderId, type, recipient });
  return dedupeKey ? { dedupeKey } : null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMessage({ type, orderId, status, trackingNumber, trackingUrl, customerName }) {
  const labels = {
    order_confirmation: ['Order confirmation', `We received your order ${orderId}.`],
    status: ['Order status update', `Your order ${orderId} is now ${status}.`],
    shipment: ['Your order has shipped', `Your order ${orderId} is on its way.`],
    delivery: ['Your order was delivered', `Your order ${orderId} has been delivered.`],
  };
  const [subject, summary] = labels[type];
  const lines = [customerName ? `Hello ${customerName},` : 'Hello,', summary];
  if (status && type !== 'status') lines.push(`Status: ${status}`);
  if (trackingNumber) lines.push(`Tracking number: ${trackingNumber}`);
  if (trackingUrl) lines.push(`Track your shipment: ${trackingUrl}`);
  const text = lines.join('\n\n');
  const html = lines.map((line, index) => index === 0 ? `<p>${escapeHtml(line)}</p>` : `<p>${escapeHtml(line)}</p>`).join('');
  return { subject, text, html };
}

function outcome(status, extra = {}) {
  return { ok: status === 'sent', status, ...extra };
}

/**
 * Send one email through Resend. `fetchImpl` is injectable for tests and
 * callers that provide a platform-specific fetch implementation.
 */
export async function sendNotification(input = {}, options = {}) {
  try {
    const type = String(input.type || '').trim().toLowerCase();
    const to = String(input.to || input.recipient || '').trim();
    const config = getEmailConfiguration(options.env || process.env);
    const dedupeKey = createNotificationDedupeKey({ orderId: input.orderId, type, recipient: to });

    if (!EMAIL_TYPES.has(type)) return outcome('invalid', { code: 'INVALID_TYPE', message: 'Unsupported notification type', dedupeKey });
    if (!isValidEmail(to)) return outcome('invalid', { code: 'INVALID_RECIPIENT', message: 'Recipient email is invalid', dedupeKey });
    if (!config.provider) return outcome('unconfigured', { code: 'EMAIL_PROVIDER_MISSING', message: 'Email provider is not configured', dedupeKey });
    if (config.provider !== 'resend') return outcome('unsupported', { code: 'EMAIL_PROVIDER_UNSUPPORTED', message: 'Configured email provider is unsupported', dedupeKey });
    if (!config.apiKey || !config.from) return outcome('unconfigured', { code: 'RESEND_CONFIGURATION_MISSING', message: 'Resend email configuration is incomplete', dedupeKey });

    const message = renderMessage({ ...input, type });
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') return outcome('failed', { code: 'FETCH_UNAVAILABLE', message: 'Fetch is unavailable', dedupeKey });

    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(dedupeKey ? { 'Idempotency-Key': dedupeKey } : {}),
      },
      body: JSON.stringify({ from: config.from, to: [to], subject: message.subject, text: message.text, html: message.html }),
    });

    if (!response || !response.ok) {
      return outcome('failed', { code: 'PROVIDER_ERROR', message: `Resend request failed (${response?.status || 'unknown'})`, dedupeKey });
    }
    let providerId = null;
    try { providerId = (await response.json())?.id || null; } catch (_) { /* response body is optional */ }
    return outcome('sent', { providerId, dedupeKey });
  } catch (error) {
    // Deliberately return a generic message; transport exceptions can contain headers or URLs.
    return outcome('failed', { code: 'DELIVERY_ERROR', message: 'Email delivery failed' });
  }
}

function typedSender(type) {
  return (input = {}, options = {}) => sendNotification({ ...input, type }, options);
}

export const sendOrderConfirmationEmail = typedSender('order_confirmation');
export const sendOrderStatusNotificationEmail = typedSender('status');
export const sendShipmentNotificationEmail = typedSender('shipment');
export const sendDeliveryNotificationEmail = typedSender('delivery');

export { RESEND_ENDPOINT };
