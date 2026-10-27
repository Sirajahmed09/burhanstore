import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveShippingFee, validateShippingSettings } from '../lib/commerce/shipping.js';
import { publicProduct } from '../lib/commerce/publicProduct.js';
import { normalizePakistaniPhone } from '../lib/utils/phone.js';
import { areOrdersPayloadCompatible } from '../lib/orders/idempotency.js';

const settings = { shippingFee: 200, shippingRules: [{ province: 'Sindh', fee: 250 }, { province: 'Sindh', city: 'Karachi', fee: 150 }, { province: 'Punjab', city: 'Lahore', fee: 0 }] };
assert.equal(resolveShippingFee(settings, { province: ' sindh ', city: 'KARACHI' }), 150);
assert.equal(resolveShippingFee(settings, { province: 'Sindh', city: 'Hyderabad' }), 250);
assert.equal(resolveShippingFee(settings, { province: 'Punjab', city: 'Lahore' }), 0);
assert.equal(resolveShippingFee(settings, { province: 'Balochistan', city: 'Quetta' }), 200);
for (const invalid of [{ shippingFee: -1 }, { shippingRules: [{ province: 'Sindh', fee: '100' }] }, { shippingRules: [{ province: 'Sindh', fee: 1 }, { province: 'sindh', fee: 2 }] }]) assert.ok(validateShippingSettings(invalid));
assert.equal(validateShippingSettings(settings), null);
const safe = publicProduct({ name: 'Test', costPrice: 10, warranty: { duration: '6 Months' }, description: 'Buy authentic audio with 6-month replacement warranty.', specifications: { Warranty: '6 Months', Colour: 'Black' }, faqs: [{ question: 'Warranty?', answer: '6 months' }] });
assert.equal(safe.costPrice, undefined);
assert.equal(safe.warranty, undefined);
assert.equal(safe.specifications.Warranty, undefined);
assert.equal(safe.faqs.length, 0);
assert.ok(!/authentic|6.month.*warranty/i.test(safe.description));

// Execute the real public route against isolated collections, without a DB/network.
const products = [{ _id: 'p1', name: 'Test Earbuds', price: 1000, stock: 1, status: 'active' }];
const orders = [];
const collections = {
  settings: { findOne: async () => settings },
  products: {
    findOne: async query => products.find(p => p._id === query._id),
    updateOne: async (query, update) => {
      const id = query.$and ? query.$and[0]._id : query._id;
      const p = products.find(p => p._id === id);
      const minStock = query.$and?.[1]?.stock?.$gte;
      if (!p || (minStock !== undefined && p.stock < minStock)) return { matchedCount: 0 };
      p.stock += update.$inc.stock;
      return { matchedCount: 1 };
    },
  },
  orders: {
    findOne: async query => orders.find(o => query.clientReferenceId ? o.clientReferenceId === query.clientReferenceId : o._id === query._id),
    insertOne: async order => { orders.push(structuredClone(order)); return { insertedId: order._id }; },
  },
};
let source = fs.readFileSync('app/api/[[...path]]/route.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
const factory = new Function('NextResponse', 'getCollection', 'getDatabaseStatus', 'buildIdQuery', 'uuidv4', 'revalidatePath', 'notifyOrderCustomer', 'areOrdersPayloadCompatible', 'resolveShippingFee', 'normalizePakistaniPhone', 'publicProduct', source + '\nreturn { POST };');
const { POST } = factory({ json: (body, init) => Response.json(body, init) }, async name => collections[name], () => ({}), id => ({ _id: id }), () => 'test-order', () => {}, async () => ({ ok: true }), areOrdersPayloadCompatible, resolveShippingFee, normalizePakistaniPhone, publicProduct);
const base = { clientReferenceId: 'checkout-1', paymentMethod: 'cod', customer: { name: 'Test Customer', phone: '+92 300 1234567', province: 'Sindh', city: 'Karachi', address: 'Test street' }, items: [{ productId: 'p1', quantity: 1, price: 1 }] };
async function submit(payload) { return POST(new Request('http://localhost/api/orders', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })); }
for (const paymentMethod of ['card', 'online', 'bank', undefined]) assert.equal((await submit({ ...base, paymentMethod })).status, 400);
for (const quantity of [0, -1, 1.5, '1x', 101]) assert.equal((await submit({ ...base, items: [{ productId: 'p1', quantity }] })).status, 400);
assert.equal((await submit({ ...base, customer: { ...base.customer, phone: '1234567890' } })).status, 400);
assert.equal((await submit({ ...base, customer: { ...base.customer, city: ' ' } })).status, 400);
const response = await submit(base);
assert.equal(response.status, 201);
const result = await response.json();
assert.equal(result.order.total, 1150, 'Server ignores client price and resolves city delivery charge');
assert.equal(result.order.customer.phone, '03001234567');
assert.equal(products[0].stock, 0);
const retry = await submit(base);
assert.equal(retry.status, 200, 'Retry recovers accepted order after final stock unit sold');
assert.equal(orders.length, 1);
assert.equal(products[0].stock, 0);
assert.equal((await submit({ ...base, customer: { ...base.customer, address: 'Different address' } })).status, 409);
assert.equal((await submit({ ...base, customer: { ...base.customer, province: 'Punjab' } })).status, 409);
console.log('Launch readiness: shipping precedence/validation, public copy/privacy, and real order handler payment/quantity/phone/pricing/retry checks passed. No live services used.');

const unconfirmed = { name: 'Test earbuds', shortDescription: 'ANC and 36 hours', oldPrice: 2000, price: 1000, rating: 5, reviewCount: 100, inBox: ['Cable'], specifications: { Battery: '36 hours' } };
const unpublished = publicProduct(unconfirmed);
assert.equal(unpublished.oldPrice, null);
assert.equal(unpublished.rating, 0);
assert.deepEqual(unpublished.inBox, []);
assert.deepEqual(unpublished.specifications, {});
assert.equal(unconfirmed.oldPrice, 2000, 'Public sanitization must not alter admin database data');
const confirmed = publicProduct({ ...unconfirmed, specificationsVerified: true, compareAtPriceVerified: true });
assert.equal(confirmed.oldPrice, 2000);
assert.equal(confirmed.specifications.Battery, '36 hours');
assert.deepEqual(publicProduct(unpublished), unpublished, 'Repeated public sanitization must preserve the same content');
console.log('Unconfirmed performance, package, comparison-price and rating claims stay hidden; confirmed details remain editable.');
