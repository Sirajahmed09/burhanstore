import assert from 'node:assert/strict';
import {
  ORDER_STATUSES,
  ALLOWED_ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  getAllowedOrderTransitions,
  validateOrderStatusTransition
} from '../lib/orders/lifecycle.js';
import { isTrustedHttpsUrl, validateShipmentDetails } from '../lib/orders/shipment.js';

assert.deepEqual(ORDER_STATUSES, [
  'pending', 'confirmed', 'processing', 'packed', 'shipped',
  'delivered', 'cancelled', 'returned', 'refunded'
]);
assert.equal(canTransitionOrderStatus('pending', 'confirmed'), true);
assert.equal(canTransitionOrderStatus('confirmed', 'processing'), true);
assert.equal(canTransitionOrderStatus('processing', 'packed'), true);
assert.equal(canTransitionOrderStatus('packed', 'shipped'), true);
assert.equal(canTransitionOrderStatus('shipped', 'delivered'), true);
assert.equal(canTransitionOrderStatus('delivered', 'returned'), true);
assert.equal(canTransitionOrderStatus('returned', 'refunded'), true);

for (const status of ['pending', 'confirmed', 'processing', 'packed']) {
  assert.equal(canTransitionOrderStatus(status, 'cancelled'), true);
}
assert.equal(canTransitionOrderStatus('shipped', 'cancelled'), false);
assert.equal(canTransitionOrderStatus('delivered', 'cancelled'), false);
assert.equal(canTransitionOrderStatus('pending', 'shipped'), false);
assert.equal(canTransitionOrderStatus('returned', 'delivered'), false);
assert.equal(canTransitionOrderStatus('delivered', 'refunded'), false);
assert.equal(canTransitionOrderStatus('refunded', 'pending'), false);
assert.equal(canTransitionOrderStatus('pending', 'pending'), false);
assert.equal(canTransitionOrderStatus('unknown', 'confirmed'), false);
assert.deepEqual(getAllowedOrderTransitions('cancelled'), []);
assert.equal(validateOrderStatusTransition('packed', 'shipped').valid, true);
assert.equal(validateOrderStatusTransition('shipped', 'cancelled').valid, false);
assert.deepEqual(ALLOWED_ORDER_TRANSITIONS.refunded, []);

assert.equal(isTrustedHttpsUrl('https://courier.example/track/ABC-123'), true);
assert.equal(isTrustedHttpsUrl('http://courier.example/track/ABC-123'), false);
assert.equal(isTrustedHttpsUrl('javascript:alert(1)'), false);
assert.equal(isTrustedHttpsUrl('https://localhost/track/ABC-123'), false);
assert.equal(isTrustedHttpsUrl('https://127.0.0.1/track/ABC-123'), false);
assert.equal(isTrustedHttpsUrl('https://user:pass@courier.example/track/ABC-123'), false);

const validShipment = validateShipmentDetails({
  courier: 'DHL',
  trackingNumber: 'ABC-123',
  trackingUrl: ' https://courier.example/track/ABC-123 '
});
assert.equal(validShipment.valid, true);
assert.deepEqual(validShipment.value, {
  courier: 'DHL',
  trackingNumber: 'ABC-123',
  trackingUrl: 'https://courier.example/track/ABC-123'
});

const invalidShipment = validateShipmentDetails({
  courier: '',
  trackingNumber: '',
  trackingUrl: 'http://localhost/track'
});
assert.equal(invalidShipment.valid, false);
assert.deepEqual(Object.keys(invalidShipment.errors).sort(), ['courier', 'trackingNumber', 'trackingUrl']);

console.log('Order lifecycle and shipment validation tests passed');
