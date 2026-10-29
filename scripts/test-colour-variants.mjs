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
const defaults = getColourVariants({ ...product, variants:[] });
assert.equal(defaults[0].color,'White');assert.equal(defaults[1].enabled,false);assert.equal(defaults[1].price,null,'Do not invent the owner\'s Black selling price');
assert.equal(validateColourVariants(product.variants),null);
assert.equal(getColourVariants({ ...product, price: 0 })[0].enabled, false, 'A colour without a valid base price must not be advertised as available');
for(const invalid of [ [{...product.variants[1],price:null}], [{...product.variants[1],price:-1}], [{...product.variants[1],price:1.001}], [product.variants[0],product.variants[0]], [{...product.variants[1],id:'$black'}] ]) assert.ok(validateColourVariants(invalid));
assert.equal(resolveColourSelection(product,'black').price,2499);assert.equal(resolveColourSelection(product).price,2199);assert.deepEqual(colourPriceRange(product),{low:2199,high:2499,count:2});
assert.throws(()=>resolveColourSelection({...product,variants:defaults},'black'));
assert.throws(()=>resolveColourSelection(product,'unknown'));
assert.equal(publicProduct({...product,variants:product.variants.map(v=>({...v, costPrice:400,internalNote:'private'}))}).variants[1].costPrice,undefined);
let cart=addCartLine([],cartProduct(product,'white'),1);cart=addCartLine(cart,cartProduct(product,'black'),1);
assert.equal(cart.length,2);assert.notEqual(cartLineKey(cart[0]),cartLineKey(cart[1]));assert.equal(cart[1].price,2499);
cart=addCartLine(cart,cartProduct(product,'black'),2);assert.equal(cart[1].quantity,2);assert.equal(cart[0].quantity,1,'Shared stock caps all colours together');
cart=updateCartLine(cart,cartLineKey(cart[0]),3);assert.equal(cart[0].quantity,1);cart=updateCartLine(cart,cartLineKey(cart[1]),0);assert.equal(cart.length,1);assert.equal(cart[0].color,'White');
assert.throws(()=>validateOrderLimits([{productId:product._id,variantId:'white',quantity:2},{productId:product._id,variantId:'black',quantity:2}],9000),error=>error.status===400);

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
let result=await request('cart/validate',{items:base.items});let payload=await result.json();assert.equal(result.status,200);assert.equal(payload.items[1].price,2499);assert.equal(payload.items[1].color,'Black');assert.equal(payload.items[1].costPrice,undefined);
result=await request('orders',base);payload=await result.json();assert.equal(result.status,201);assert.equal(payload.order.subtotal,4698);assert.equal(payload.order.total,4898);assert.equal(payload.order.items[1].variantId,'black');assert.equal(payload.order.items[1].color,'Black');assert.equal(p.stock,1);
// Accepted retries recover the exact immutable colours and prices even after price/stock changes.
p.stock=0;p.price=9999;p.variants[1].enabled=false;
result=await request('orders',base);assert.equal(result.status,200);assert.equal((await result.json()).order.total,4898);assert.equal(orders.length,1);
assert.equal((await request('orders',{...base,items:base.items.map(item=>({...item,variantId:'white'}))})).status,409);
assert.equal((await request('orders',{...base,clientReferenceId:'colour-unknown',items:[{productId:p._id,variantId:'purple',quantity:1}]})).status,409);
assert.equal((await request('orders',{...base,clientReferenceId:'colour-unavailable',items:[{productId:p._id,variantId:'black',quantity:1}]})).status,409);
Object.assign(p,structuredClone(product));p.stock=2;
assert.equal((await request('orders',{...base,clientReferenceId:'colour-shared-stock',items:[{productId:p._id,variantId:'white',quantity:2},{productId:p._id,variantId:'black',quantity:1}]})).status,400);assert.equal(p.stock,2);
p.stock=10;
assert.equal((await request('orders',{...base,clientReferenceId:'colour-bulk-block',items:[{productId:p._id,variantId:'white',quantity:2},{productId:p._id,variantId:'black',quantity:2}]})).status,400);assert.equal(p.stock,10);
// A failed reservation on the second colour restores the first colour's shared units.
p.stock=3;stockWrites=0;failReservationAt=2;
assert.equal((await request('orders',{...base,clientReferenceId:'colour-reserve-failure'})).status,409);assert.equal(p.stock,3);assert.equal(orders.length,1);failReservationAt=0;

// Variant-only price changes must use the existing owner approval workflow.
const adminSource=fs.readFileSync('app/api/admin/[[...path]]/route.js','utf8').replace(/^import[\s\S]*?from ['"][^'"]+['"];?\s*/gm,'').replace(/export /g,'');
const approvals=[];let directUpdates=0;
const adminDeps={ NextResponse:deps.NextResponse,requireAuth:async()=>({authenticated:true,user:{id:'employee',role:'employee',name:'QA',email:'qa@example.invalid'}}),requirePermission:async()=>({authorized:true}),readJsonBody, getColourVariants,validateColourVariants,getCollection:async name=>name==='products'?{findOne:async()=>p,updateOne:async()=>{directUpdates++;}}:name==='approvals'?{insertOne:async value=>approvals.push(value)}:{}, buildIdQuery:deps.buildIdQuery,doesActionRequireApproval:()=>true,snapshotApprovalFields,uuidv4:()=> 'mock-approval',logAuditEvent:async()=>{} };
const {PUT}=new Function(...Object.keys(adminDeps),adminSource+'\nreturn {PUT};')(...Object.values(adminDeps));
const variants=structuredClone(p.variants);variants[1].price=2799;
result=await PUT(new Request('https://example.invalid/api/admin/products/'+p._id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({variants})}));assert.equal(result.status,202);assert.equal(directUpdates,0);assert.equal(approvals[0].proposedChanges.variants[1].price,2799);assert.equal('price' in approvals[0].proposedChanges,false,'A variant-only request must not turn the base price into NaN');
console.log('Colour integration passed: per-colour prices, safe defaults, distinct cart lines, shared stock, server pricing, no bulk bypass, immutable retry colours, rollback, and employee price approvals. Synthetic data only; no live orders or settings writes.');
