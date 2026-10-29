import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { getColourVariants, validateColourVariants, resolveColourSelection, cartProduct, cartLineKey, colourPriceRange } from '../lib/commerce/colourVariants.js';
import { addCartLine, updateCartLine } from '../lib/commerce/cartLines.js';
import { readJsonBody, clientAddress, literalSearch } from '../lib/security/requests.js';
import { validateOrderLimits } from '../lib/security/rate-limit.js';
import { publicProduct } from '../lib/commerce/publicProduct.js';
import { normalizePakistaniPhone } from '../lib/utils/phone.js';
import { resolveShippingFee } from '../lib/commerce/shipping.js';
import { areOrdersPayloadCompatible } from '../lib/orders/idempotency.js';
import { snapshotApprovalFields } from '../lib/admin/approvalIntegrity.js';
const product = { _id:'burhan-pro-2-flagship', slug:'burhan-pro-2', name:'BURHAN Pro 2', category:'Wireless Earbuds', price:2199, stock:3, status:'active', images:['/brand/icon-192.png'], costPrice:800, variants:[
 {id:'white',color:'White',price:null,useBasePrice:true,enabled:true},
 {id:'black',color:'Black',price:2499,useBasePrice:false,enabled:true},
] };
// Exercise the actual public order and cart handlers using isolated collections.
const orders=[];let serial=0;let stockWrites=0;let failReservationAt=0;
const p=structuredClone(product);
const collections={ settings:{findOne:async()=>({shippingFee:200})}, products:{
 findOne:async query=>(query._id===p._id?p:null),
 updateOne:async(query,update)=>{const min=query.$and?.[1]?.stock?.$gte; if(min!==undefined){stockWrites++;if((failReservationAt&&stockWrites===failReservationAt)||p.stock<min)return {matchedCount:0};}p.stock+=update.$inc.stock;return {matchedCount:1};},
},orders:{findOne:async query=>orders.find(order=>query.clientReferenceId?order.clientReferenceId===query.clientReferenceId:order._id===query._id),insertOne:async order=>{orders.push(structuredClone(order));return {insertedId:order._id};}}};
const source=fs.readFileSync('app/api/[[...path]]/route.js','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
const deps={NextResponse:{json:(body,init)=>Response.json(body,init)},getCollection:async name=>collections[name],getDatabaseStatus:()=>({}),buildIdQuery:id=>({_id:id}),uuidv4:()=>`mock-order-${++serial}`,revalidatePath:()=>{},notifyOrderCustomer:async()=>({ok:true}),areOrdersPayloadCompatible,resolveShippingFee,normalizePakistaniPhone,publicProduct,randomBytes,timingSafeEqual,readJsonBody,clientAddress,literalSearch,consumeRateLimit:async()=>{},validateOrderLimits,verifyHumanCheck:async()=>{},resolveColourSelection,cartLineKey};
const {POST}=new Function(...Object.keys(deps),source+'\nreturn {POST};')(...Object.values(deps));
const request=(path,body)=>POST(new Request('https://example.invalid/api/'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));
const base={clientReferenceId:'colour-test-key',paymentMethod:'cod',customer:{name:'TEST ONLY',phone:'03001234567',address:'Test street',city:'Karachi',province:'Sindh'},items:[{productId:p._id,variantId:'white',quantity:1,price:1},{productId:p._id,variantId:'black',quantity:1,price:1,color:'White'}]};

let insertMode = 'success';
let verificationFails = false;
const normalFind = collections.orders.findOne;
collections.orders.findOne = async query => {
  if (verificationFails) throw new Error('verification connection lost');
  return normalFind(query);
};
collections.orders.insertOne = async order => {
  if (insertMode === 'success') { orders.push(structuredClone(order)); return; }
  if (insertMode === 'own-timeout') { orders.push(structuredClone(order)); throw new Error('socket timed out'); }
  if (insertMode === 'other-timeout') { orders.push({ ...structuredClone(order), _id: 'concurrent-winner' }); p.stock--; throw new Error('socket timed out'); }
  if (insertMode === 'verification-lost') { orders.push(structuredClone(order)); verificationFails = true; throw new Error('ack lost'); }
  if (insertMode === 'rejected') throw Object.assign(new Error('validation rejected'), { code: 121 });
  throw new Error('unknown write outcome');
};
for (const mode of ['own-timeout', 'other-timeout', 'verification-lost', 'rejected', 'unknown']) {
  orders.length = 0; p.stock = 10; verificationFails = false; insertMode = mode;
  const response = await request('orders', { ...base, clientReferenceId: 'audit-' + mode, items: [base.items[0]] });
  const expectedStatus = ['own-timeout', 'other-timeout'].includes(mode) ? 200 : mode === 'rejected' ? 500 : 503;
  assert.equal(response.status, expectedStatus, mode);
  assert.equal(p.stock, mode === 'rejected' ? 10 : 9, mode + ' must preserve reservation ownership');
  if (mode === 'verification-lost') {
    verificationFails = false;
    const retry = await request('orders', { ...base, clientReferenceId: 'audit-' + mode, items: [base.items[0]] });
    assert.equal(retry.status, 200); assert.equal(orders.length, 1); assert.equal(p.stock, 9);
  }
}
const faq = publicProduct({ ...product, specificationsPublished: true, faqs: [{ question: 'Is Cash on Delivery available?', answer: '150+ cities' }] });
assert.doesNotMatch(faq.faqs[0].answer, /150/);
console.log('Final audit: actual order-handler tests passed for own timeout, concurrent winner timeout, failed verification/retry, definitive rejection, unknown outcome, and unsupported courier claims.');

// Run the real checkout component with controlled hooks, storage and transport.
// SWC only removes JSX; callbacks under test are the shipped component's code.
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const React = require('react');
const { transform } = require('next/dist/build/swc');
const checkoutSource = fs.readFileSync('app/checkout/page.jsx', 'utf8');
const imports = [...checkoutSource.matchAll(/^import (.+?) from ['"].+?['"];$/gm)].flatMap(match => match[1].replace(/[{}]/g, '').split(',').map(name => name.trim()));
const compiled = await transform(checkoutSource.replace(/^import .*;\n/gm, '').replace('export default function CheckoutPage', 'function CheckoutPage'), { filename: 'checkout.jsx', jsc: { target: 'es2022', parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } }, module: { type: 'es6' } });
function checkoutHarness({ checking = false, storageBlocked = false } = {}) {
  const effects = [], states = [], redirects = [];
  let cursor = 0, cleared = false;
  const deps = Object.fromEntries(imports.map(name => [name, () => null]));
  Object.assign(deps, { React, cartLineKey, normalizePakistaniPhone, resolveShippingFee,
    motion: { div: 'div' }, useRef: value => ({ current: value }),
    useState: initial => {
      const index = cursor++;
      states[index] = index === 1 ? { fullName: 'TEST ONLY', phone: '03001234567', province: 'Sindh', city: 'Karachi', address: 'Test street', email: '', alternatePhone: '', paymentMethod: 'cod', website: '', notes: '' } : index === 7 ? checking : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect: fn => effects.push(fn), useRouter: () => ({ push: url => redirects.push(url) }),
    useStoreSettings: () => ({ settings: { shippingFee: 0 }, loading: false, error: '' }),
    useCart: () => ({ cart: [{ ...product, quantity: 1, variantId: 'white' }], isLoaded: true, getCartTotal: () => 2199, clearCart: () => { cleared = true; }, replaceCart: () => {} }),
    sessionStorage: { getItem: () => null, setItem: () => { if (storageBlocked) throw new Error('Storage blocked'); }, removeItem: () => { if (storageBlocked) throw new Error('Storage blocked'); } },
    window: { scrollTo: () => {} },
  });
  deps.window.sessionStorage = deps.sessionStorage;
  const timers = [];
  deps.setTimeout = callback => { timers.push(callback); return timers.length; };
  deps.clearTimeout = () => {};
  deps.fetch = checking ? (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))) : async () => Response.json({ success: true, order: { _id: 'audit-order-123', receiptToken: 'test-only' } });
  const component = new Function(...Object.keys(deps), compiled.code + '\nreturn CheckoutPage;')(...Object.values(deps));
  const tree = component();
  const find = node => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'form') return node;
    for (const child of React.Children.toArray(node.props?.children)) { const found = find(child); if (found) return found; }
    return null;
  };
  return { effects, timers, states, redirects, form: find(tree), cleared: () => cleared };
}
const blocked = checkoutHarness({ storageBlocked: true });
await blocked.form.props.onSubmit({ preventDefault() {} });
assert.equal(blocked.cleared(), true, 'Storage failure must not turn an accepted order into a checkout failure');
assert.deepEqual(blocked.redirects, ['/success?orderId=audit-order-123']);
const timedOut = checkoutHarness({ checking: true });
const cleanup = timedOut.effects[0]();
timedOut.timers[0]();
await new Promise(resolve => setImmediate(resolve));
assert.equal(timedOut.states[7], false, 'Cart timeout must stop loading');
assert.match(timedOut.states[8], /timed out/);
cleanup();
console.log('Actual checkout component passed: blocked sessionStorage still navigates to receipt; timed-out cart validation exits loading with a visible error.');

const { renderToStaticMarkup } = require('react-dom/server');
const successSource = fs.readFileSync('app/success/page.jsx', 'utf8');
const successCompiled = await transform(successSource.replace(/^import .*;\n/gm, '').replace('export default function OrderSuccessPage', 'function OrderSuccessPage'), { filename: 'success.jsx', jsc: { target: 'es2022', parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } }, module: { type: 'es6' } });
async function renderReceipt(saved, response) {
  const values = [], effects = []; let cursor = 0; let purchases = 0;
  const deps = { React, useState: initial => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = value; }]; }, useEffect: fn => effects.push(fn), useSearchParams: () => new URLSearchParams('orderId=audit-order-123'), motion: { div: 'div' }, Link: 'a', CheckCircle2: () => null, Package: () => null, ArrowRight: () => null, MessageCircle: () => null, Truck: () => null, ShieldCheck: () => null, trackPurchase: () => { purchases++; }, sessionStorage: { getItem: key => key.startsWith('burhan_order_') ? JSON.stringify(saved) : null, setItem: () => {} }, fetch: response };
  const component = new Function(...Object.keys(deps), successCompiled.code + '\nreturn SuccessContent;')(...Object.values(deps));
  component(); effects[0](); await new Promise(resolve => setImmediate(resolve)); cursor = 0;
  return { html: renderToStaticMarkup(component()), purchases };
}
let receipt = await renderReceipt(null, async () => new Response('{}', { status: 404 }));
assert.doesNotMatch(receipt.html, /Thank You for Your Order|Order Confirmed/);
assert.match(receipt.html, /Check Your Order Status/); assert.equal(receipt.purchases, 0);
const saved = { _id: 'audit-order-123', receiptToken: 'synthetic', customer: { name: 'TEST ONLY' }, shipping: 200, total: 2199, items: [] };
receipt = await renderReceipt(saved, async () => Response.json({ order: { _id: saved._id, shipping: 0, total: 2199 } }));
assert.match(receipt.html, /Delivery:<\/span><span[^>]*>PKR 0<\/span>/);
assert.equal(receipt.purchases, 1);
receipt = await renderReceipt(saved, async () => { throw new Error('offline'); });
assert.match(receipt.html, /audit-order-123/); assert.match(receipt.html, /Thank You for Your Order/); assert.equal(receipt.purchases, 0);
console.log('Actual confirmation component passed: unknown receipt does not claim success; verified zero shipping is preserved; offline fallback retains the saved order without recording an unverified purchase.');
