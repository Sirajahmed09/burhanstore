import { getCollection } from '@/lib/db/mongodb';
import {
  sendOrderConfirmationEmail,
  sendOrderStatusNotificationEmail,
  sendShipmentNotificationEmail,
  sendDeliveryNotificationEmail,
  createNotificationDedupeKey,
} from './email.js';

const senderByType = {
  order_confirmation: sendOrderConfirmationEmail,
  status: sendOrderStatusNotificationEmail,
  shipment: sendShipmentNotificationEmail,
  delivery: sendDeliveryNotificationEmail,
};

/**
 * Send a notification after persistence, recording the outcome. Email is
 * deliberately best-effort: a provider outage must not fail an order update.
 */
export async function notifyOrderCustomer(order, type, extra = {}) {
  const recipient = String(order?.customer?.email || '').trim();
  const orderId = String(order?._id || '').trim();
  const send = senderByType[type];
  const dedupeKey = createNotificationDedupeKey({ orderId, type, recipient });

  if (!send || !orderId || !recipient || !dedupeKey) {
    return { ok: false, status: 'skipped', code: 'NO_EMAIL_RECIPIENT' };
  }

  try {
    const notifications = await getCollection('notifications');
    const existing = await notifications.findOne({ dedupeKey });
    if (existing?.status === 'sent') {
      return { ok: true, status: 'already_sent', dedupeKey };
    }

    const result = await send({
      orderId,
      to: recipient,
      customerName: order.customer?.name,
      status: extra.status || order.status,
      trackingNumber: extra.trackingNumber || order.shipment?.trackingNumber,
      trackingUrl: extra.trackingUrl || order.shipment?.trackingUrl,
    });

    await notifications.updateOne(
      { dedupeKey },
      {
        $set: {
          dedupeKey,
          orderId,
          type,
          recipient,
          status: result.status,
          code: result.code || null,
          providerId: result.providerId || null,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true },
    );

    return { ...result, dedupeKey };
  } catch (error) {
    console.warn('[Order notification] Email attempt failed:', error?.message || 'unknown error');
    return { ok: false, status: 'failed', code: 'NOTIFICATION_RECORDING_FAILED', dedupeKey };
  }
}
