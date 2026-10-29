import assert from 'node:assert/strict';
import fs from 'node:fs';
import { publicProduct } from '../lib/commerce/publicProduct.js';
import { withProductEditorialDefaults } from '../lib/commerce/productPublishing.js';
import { readJsonBody } from '../lib/security/requests.js';
const original = { _id: 'burhan-pro-2-flagship', slug: 'burhan-pro-2', name: 'BURHAN Pro 2', category: 'Wireless Earbuds', sku: 'BRH-PRO2-001', price: 2199, stock: 45, images: ['/brand/icon-192.png'], specificationsVerified: false, specifications: { Bluetooth: '5.3', 'Official Warranty': '6 Months' }, description: 'Experience balanced high-fidelity sound with BURHAN Pro 2. Legacy copy.', shortDescription: 'Balanced acoustic clarity, legacy copy.', inBox: ['Earbuds', 'Official Warranty Card'], rating: 5, reviewCount: 38, costPrice: 900 };
const published = publicProduct(original);
assert.equal(published.specifications.Bluetooth, '5.3');
assert.equal(published.specifications['Official Warranty'], undefined);
assert.equal(published.specificationsPublished, true);
assert.equal(published.specificationsVerified, false, 'Publication must not invent testing verification');
assert.equal(published.rating, 0); assert.equal(published.reviewCount, 0, 'Publication must not enable legacy fake rating counters');
assert.equal(published.costPrice, undefined); assert.deepEqual(published.inBox, ['Earbuds']);
assert.match(published.description, /YOUR EVERYDAY SOUND/); assert.match(published.description, /\n\n/);
assert.deepEqual(publicProduct(published), published, 'Repeated sanitization must keep published details and paragraphs');
assert.equal(withProductEditorialDefaults({ ...original, description: 'My revised store description' }).description, 'My revised store description');
assert.deepEqual(publicProduct({ ...original, specificationsPublished: false }).specifications, {}, 'Explicit owner hide must override launch default');
assert.deepEqual(publicProduct({ ...original, _id: 'duplicate', slug: 'burhan-pro-2-copy' }).specifications, {}, 'Copies do not inherit the original product publication');
assert.equal(original.description.startsWith('Experience'), true, 'Read-time editorial defaults must not mutate the database record');

// Real create/edit route, isolated collections: a collision returns an edit link and never inserts.
const products = [structuredClone(original)]; let inserts = 0; let updates = 0;
const match = (product, query) => query.$or ? query.$or.some(item => match(product, item)) : Object.entries(query).every(([key, value]) => value?.$regex ? new RegExp(value.$regex, value.$options).test(String(product[key] || '')) : product[key] === value);
const productsCol = { findOne: async query => products.find(p => match(p, query)), insertOne: async p => { inserts++; products.push(p); }, updateOne: async (query, update) => { updates++; Object.assign(products.find(p => match(p, query)), update.$set); return { matchedCount: 1 }; } };
const source = fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];?\s*/gm, '').replace(/export /g, '');
const deps = { NextResponse: { json: (body, init) => Response.json(body, init) }, requireAuth: async () => ({ authenticated: true, user: { id:'owner', email:'qa@example.invalid', role:'owner' } }), requirePermission: async () => ({ authorized:true }), readJsonBody, getCollection: async name => name === 'products' ? productsCol : { updateOne: async () => ({ matchedCount:1 }) }, uuidv4: () => 'new-product-id', logAuditEvent: async () => {}, revalidatePath: () => {}, buildIdQuery: id => ({ _id:id }), doesActionRequireApproval: () => false, withProductEditorialDefaults };
const { POST, PUT } = new Function(...Object.keys(deps), source + '\nreturn { POST, PUT };')(...Object.values(deps));
const submit = (method, path, body) => new Request('https://example.invalid/api/admin/'+path, { method, headers:{'content-type':'application/json'}, body:JSON.stringify(body) });
for (const body of [
  { name:'burhan   PRO 2', category:'Wireless Earbuds', price:1999, slug:'a-new-slug' },
  { name:'Another title', category:'Wireless Earbuds', price:1999, slug:'burhan-pro-2' },
  { name:'Another title', category:'Wireless Earbuds', price:1999, sku:'brh-pro2-001', slug:'a-new-slug' },
]) {
 const response = await POST(submit('POST','products',body)); assert.equal(response.status,409); assert.equal((await response.json()).existingProductId,original._id);
}
assert.equal(inserts,0);
const response = await PUT(submit('PUT','products/'+original._id,{ name:original.name, description:'Edited original description', specificationsPublished:true }));
assert.equal(response.status,200); assert.equal(updates,1); assert.equal(inserts,0); assert.equal(products.length,1); assert.equal(products[0].description,'Edited original description');
const missing = await PUT(submit('PUT','products/missing',{ name:'Missing' }));assert.equal(missing.status,404);assert.equal(inserts,0);
console.log('Product publishing passed: original saved specs, editable descriptions, explicit hiding, no duplicate inheritance/fake ratings/private fields, real create collision guards and update-without-insert. No live writes.');

const uniqueBody = { name: 'Pods [Mini]', sku:'BRH+MINI', slug:'pods-mini', category:'Wireless Earbuds', price:999, specificationsPublished:true };
assert.equal((await POST(submit('POST','products',uniqueBody))).status,201);
assert.equal((await POST(submit('POST','products',{ ...uniqueBody, slug:'pods-mini-copy', sku:'another-sku' }))).status,409);
assert.equal(inserts,1);
