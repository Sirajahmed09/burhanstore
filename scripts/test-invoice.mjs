import assert from 'node:assert/strict';
import fs from 'node:fs';
import { invoiceSenderFromSettings, invoicePrintIssue, invoicePayment } from '../lib/orders/invoice.js';

const settings = { businessName: 'BURHAN STORE', phone: '03000000000', address: 'Karachi only', invoiceSenderAddress: 'Shop 10, Example Street\nKarachi, Sindh', smtpPassword: 'must-not-leak' };
const sender = invoiceSenderFromSettings(settings);
assert.deepEqual(Object.keys(sender).sort(), ['address', 'name', 'phone']);
assert.equal(sender.address, settings.invoiceSenderAddress);
assert.equal(invoiceSenderFromSettings({ address: 'Karachi only' }).address, '', 'Do not silently use a generic public address as a parcel return address');
const order = { _id: 'test-invoice-order', paymentMethod: 'cod', total: 2399, customer: { name: 'Test Receiver', phone: '03110000000', address: 'House 25, Test Street', city: 'Karachi' } };
assert.equal(invoicePrintIssue(order, sender), '');
assert.match(invoicePrintIssue(order, { ...sender, address: '' }), /sender/i);
assert.match(invoicePrintIssue({ ...order, customer: { ...order.customer, city: '' } }, sender), /delivery/i);
assert.deepEqual(invoicePayment(order), { total: 2399, collect: 2399, paid: false });
assert.equal(invoicePayment({ ...order, paymentStatus: 'paid' }).collect, null, 'Never ask courier to collect a paid COD amount again');
assert.equal(invoicePayment({ ...order, paymentMethod: 'card' }).collect, null, 'Never label unknown online payment as COD');
assert.equal(invoicePayment({ ...order, paymentMethod: 'card' }).paid, false, 'Do not infer paid status from payment method');

// Run the real authenticated order-details handler against isolated dependencies.
let authorized = true;
let dbReads = 0;
const source = fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];?\s*/gm, '').replace(/export /g, '');
const getCollection = async name => { dbReads++; return { findOne: async () => name === 'orders' ? order : settings }; };
const factory = new Function('NextResponse', 'requireAuth', 'getCollection', 'buildIdQuery', 'invoiceSenderFromSettings', source + '\nreturn { GET };');
const { GET } = factory({ json: (body, options) => Response.json(body, options) }, async () => ({ authenticated: authorized, user: { role: 'staff' } }), getCollection, id => ({ _id: id }), invoiceSenderFromSettings);
const request = new Request('https://example.invalid/api/admin/orders/test-invoice-order');
let result = await GET(request);
assert.equal(result.status, 200);
const payload = await result.json();
assert.deepEqual(payload.invoiceSender, sender);
assert.equal(payload.invoiceSender.smtpPassword, undefined);
authorized = false; dbReads = 0;
result = await GET(request);
assert.equal(result.status, 401);
assert.equal(dbReads, 0, 'Unauthorized request must not read order or private sender details');
console.log('Invoice checks passed: complete sender/receiver, safe COD/payment amounts, real order handler sender allowlist and authentication. No live services used.');
