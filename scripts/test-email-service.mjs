import assert from 'node:assert/strict';
import {
  sendNotification,
  sendOrderConfirmationEmail,
  sendShipmentNotificationEmail,
  createNotificationDedupeKey,
  buildNotificationDedupeFilter,
} from '../lib/notifications/email.js';

let calls = [];
const fakeFetch = async (url, init) => {
  calls.push({ url, init });
  return { ok: true, status: 200, json: async () => ({ id: 'email_test_123' }) };
};

const env = { EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_test_secret', EMAIL_FROM: 'orders@example.com' };
const sent = await sendOrderConfirmationEmail({ orderId: 'ORD-1', to: 'Customer@Example.com', customerName: 'Asha' }, { env, fetchImpl: fakeFetch });
assert.equal(sent.ok, true);
assert.equal(sent.status, 'sent');
assert.equal(sent.providerId, 'email_test_123');
assert.equal(calls.length, 1);
assert.equal(calls[0].url, 'https://api.resend.com/emails');
assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test_secret');
assert.equal(JSON.parse(calls[0].init.body).to[0], 'Customer@Example.com');

const key = createNotificationDedupeKey({ orderId: 'ORD-1', type: 'shipment', recipient: 'Customer@Example.com' });
assert.equal(key, 'email:shipment:ORD-1:customer@example.com');
assert.deepEqual(buildNotificationDedupeFilter({ orderId: 'ORD-1', type: 'shipment', recipient: 'Customer@Example.com' }), { dedupeKey: key });

const missing = await sendNotification({ type: 'status', orderId: 'ORD-2', to: 'customer@example.com' }, { env: {} , fetchImpl: fakeFetch });
assert.equal(missing.status, 'unconfigured');
assert.equal(calls.length, 1);

const invalid = await sendShipmentNotificationEmail({ orderId: 'ORD-3', to: 'not-an-email' }, { env, fetchImpl: fakeFetch });
assert.equal(invalid.status, 'invalid');

const statusFailure = await sendNotification({ type: 'delivery', orderId: 'ORD-4', to: 'customer@example.com' }, { env, fetchImpl: async () => { throw new Error('network failure'); } });
assert.equal(statusFailure.ok, false);
assert.equal(statusFailure.status, 'failed');

console.log('Email notification service tests passed');
