import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateOrderStatusTransition } from '../lib/orders/lifecycle.js';
import { areOrdersPayloadCompatible } from '../lib/orders/idempotency.js';

console.log('=== BURHAN STORE: ORDER INTEGRITY, IDEMPOTENCY & RESILIENCE VERIFICATION ===\n');

const routeContent = fs.readFileSync('app/api/[[...path]]/route.js', 'utf8');
const checkoutContent = fs.readFileSync('app/checkout/page.jsx', 'utf8');
const mongoContent = fs.readFileSync('lib/db/mongodb.js', 'utf8');

// =========================================================================
// SECTION 1: STATIC / SOURCE CONTRACT CHECKS
// (Note: These inspect source code structure, exports, and syntax patterns)
// =========================================================================
console.log('--- [STATIC CONTRACT CHECK 1]: Lexical Scoping & No ReferenceError ---');
const hasNotificationLetDeclaration = /let\s+notification\s*=\s*null;/g.test(routeContent);
assert.equal(hasNotificationLetDeclaration, true, 'notification variable must be declared with let notification = null');
const hasBrokenConstNotification = /try\s*\{[^}]*const\s+notification\s*=\s*await\s+notifyOrderCustomer/s.test(routeContent);
assert.equal(hasBrokenConstNotification, false, 'notification must NOT be block-scoped with const inside a try block');
const returnsNotification = /return\s+NextResponse\.json\(\s*\{\s*order,\s*success:\s*true,\s*notification\s*\}/.test(routeContent);
assert.equal(returnsNotification, true, 'Response must return { order, success: true, notification }');
console.log('  [PASS] Lexical scope of notification verified: declared before try-catch and returned in response.');

console.log('\n--- [STATIC CONTRACT CHECK 2]: Transactional Safety & Decoupled Notification ---');
const insertIndex = routeContent.indexOf('await ordersCol.insertOne(order);');
const notifyIndex = routeContent.indexOf("notifyOrderCustomer(order, 'order_confirmation')");
const stockReservationIndex = routeContent.indexOf('productsCol.updateOne(');
assert.ok(insertIndex > 0, 'Must persist order into ordersCol');
assert.ok(notifyIndex > 0, 'Must notify customer after persistence');
assert.ok(notifyIndex > insertIndex, 'Notification MUST execute AFTER order insertion');
assert.ok(insertIndex > stockReservationIndex, 'Order insertion MUST execute AFTER stock reservation');
const notificationTryCatchGuarded = /try\s*\{\s*notification\s*=\s*await\s+notifyOrderCustomer\(order,\s*'order_confirmation'\);\s*\}\s*catch/s.test(routeContent);
assert.equal(notificationTryCatchGuarded, true, 'notifyOrderCustomer must be wrapped in its own try-catch block');
console.log('  [PASS] Decoupling verified: email provider outages cannot invalidate persisted orders.');

console.log('\n--- [STATIC CONTRACT CHECK 3]: Canonical Payload Verification & Unique Index ---');
assert.ok(routeContent.includes('areOrdersPayloadCompatible'), 'Route must use areOrdersPayloadCompatible to verify canonical request details');
assert.ok(routeContent.includes('ordersCol.findOne({ clientReferenceId'), 'Route must query existing order by clientReferenceId');
assert.ok(mongoContent.includes("spec: { clientReferenceId: 1 }, opts: { unique: true, sparse: true }"), 'MongoDB must configure unique sparse index on clientReferenceId');
assert.ok(mongoContent.includes('globalThis.__BURHAN_MONGO_INDEX_STATUS__'), 'Index creation results must be captured in diagnostics');
console.log('  [PASS] Server payload validator and index diagnostics verified.');

console.log('\n--- [STATIC CONTRACT CHECK 4]: Ambiguous Write Recovery ---');
assert.ok(routeContent.includes('Ambiguous write handling'), 'Route must contain ambiguous write verification before stock rollback');
assert.ok(routeContent.includes('persistedOrder'), 'Route must verify whether order persisted before restoring stock');
console.log('  [PASS] Ambiguous write recovery pattern verified in source code.');

console.log('\n--- [STATIC CONTRACT CHECK 5]: Frontend Double-Click & Session Locking ---');
assert.ok(checkoutContent.includes('if (loading) return;'), 'Frontend must prevent concurrent submissions if loading is true');
assert.ok(checkoutContent.includes('submissionIdRef'), 'Frontend must track unique submission ID');
assert.ok(checkoutContent.includes('clientReferenceId: submissionIdRef.current'), 'Frontend must send clientReferenceId in orderData');
assert.ok(checkoutContent.includes('burhan_pending_checkout'), 'Frontend must persist pending submission key in sessionStorage');
assert.ok(checkoutContent.includes('cartFingerprint'), 'Frontend must bind pending submission key to cart fingerprint');
assert.ok(checkoutContent.includes('disabled={loading}'), 'Submit button must be disabled when loading is true');
console.log('  [PASS] Frontend double-click protection and session persistence verified.');


// =========================================================================
// SECTION 2: CANONICAL PAYLOAD VALIDATOR UNIT TESTS
// (Testing areOrdersPayloadCompatible function behavior directly)
// =========================================================================
console.log('\n=============================================================');
console.log('CANONICAL PAYLOAD VALIDATOR UNIT TESTS');
console.log('=============================================================');

{
  const baseOrder = {
    customer: { name: 'Siraj Ahmed', phone: '03001234567', city: 'Karachi', address: 'House 123, Street 4' },
    items: [{ productId: 'prod_1', quantity: 2, price: 5000 }],
    subtotal: 10000,
    total: 10200
  };

  // Identical retry must pass
  assert.equal(areOrdersPayloadCompatible(baseOrder, baseOrder), true, 'Identical order must be compatible');

  // Phone mismatch must reject
  const phoneMismatch = { ...baseOrder, customer: { ...baseOrder.customer, phone: '03119876543' } };
  assert.equal(areOrdersPayloadCompatible(baseOrder, phoneMismatch), false, 'Phone mismatch must be rejected');

  // Name mismatch must reject
  const nameMismatch = { ...baseOrder, customer: { ...baseOrder.customer, name: 'Ali Khan' } };
  assert.equal(areOrdersPayloadCompatible(baseOrder, nameMismatch), false, 'Name mismatch must be rejected');

  // Address mismatch must reject
  const addrMismatch = { ...baseOrder, customer: { ...baseOrder.customer, address: 'Flat 5B, Block 2' } };
  assert.equal(areOrdersPayloadCompatible(baseOrder, addrMismatch), false, 'Address mismatch must be rejected');

  // City mismatch must reject
  const cityMismatch = { ...baseOrder, customer: { ...baseOrder.customer, city: 'Lahore' } };
  assert.equal(areOrdersPayloadCompatible(baseOrder, cityMismatch), false, 'City mismatch must be rejected');

  // Cart item / quantity mismatch must reject
  const qtyMismatch = { ...baseOrder, items: [{ productId: 'prod_1', quantity: 1, price: 5000 }], subtotal: 5000, total: 5200 };
  assert.equal(areOrdersPayloadCompatible(baseOrder, qtyMismatch), false, 'Quantity mismatch must be rejected');

  const prodMismatch = { ...baseOrder, items: [{ productId: 'prod_2', quantity: 2, price: 5000 }] };
  assert.equal(areOrdersPayloadCompatible(baseOrder, prodMismatch), false, 'Product ID mismatch must be rejected');

  // Total mismatch must reject
  const totalMismatch = { ...baseOrder, total: 99999 };
  assert.equal(areOrdersPayloadCompatible(baseOrder, totalMismatch), false, 'Total mismatch must be rejected');

  console.log('  [PASS] Canonical payload validator rejects phone, name, address, cart, and financial mismatches.');
}


// =========================================================================
// SECTION 3: MOCKED BEHAVIORAL CONCURRENCY & FAILURE TESTS
// (Simulating isolated route execution with realistic asynchronous mocks)
// =========================================================================
console.log('\n=============================================================');
console.log('MOCKED BEHAVIORAL CONCURRENCY & FAILURE TESTS');
console.log('=============================================================');

class MockOrderEngine {
  constructor(initialProducts = []) {
    this.products = new Map(initialProducts.map(p => [p.id, { ...p }]));
    this.orders = [];
    this.ordersByRef = new Map();
    this.dbFailOnInsert = false;
    this.ambiguousWrite = false; // Simulates write committed in DB but socket disconnected during acknowledgment
    this.emailFail = false;
  }

  async processOrder(payload) {
    const { clientReferenceId, customer, items } = payload;

    // 1. Idempotency Check
    if (clientReferenceId) {
      const existing = this.ordersByRef.get(clientReferenceId);
      if (existing) {
        if (!areOrdersPayloadCompatible(existing, payload)) {
          return { status: 409, body: { error: 'This checkout reference was already processed with different order details.' } };
        }
        return {
          status: 200,
          body: { order: existing, success: true, notification: { ok: true, status: 'already_processed', dedupeKey: clientReferenceId } }
        };
      }
    }

    // 2. Pre-validation of quantities
    let calculatedSubtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const prod = this.products.get(item.productId);
      if (!prod) return { status: 404, body: { error: `Product not found: ${item.name}` } };
      if (prod.stock < item.quantity) {
        return { status: 400, body: { error: `Insufficient stock for "${prod.name}". Only ${prod.stock} unit(s) remaining.` } };
      }
      calculatedSubtotal += prod.price * item.quantity;
      validatedItems.push({ productId: prod.id, name: prod.name, price: prod.price, quantity: item.quantity });
    }

    // 3. Atomic stock reservation
    const reservedItems = [];
    try {
      for (const item of validatedItems) {
        const prod = this.products.get(item.productId);
        if (!prod || prod.stock < item.quantity) {
          throw new Error(`Inventory changed for "${item.name}". Please review your cart and try again.`);
        }
        prod.stock -= item.quantity;
        reservedItems.push(item);
      }
    } catch (invErr) {
      for (const item of reservedItems) {
        const prod = this.products.get(item.productId);
        if (prod) prod.stock += item.quantity;
      }
      return { status: 409, body: { error: invErr.message } };
    }

    const order = {
      _id: 'ord_' + Math.random().toString(36).slice(2, 9),
      clientReferenceId,
      items: validatedItems,
      customer: { ...customer },
      subtotal: calculatedSubtotal,
      shipping: 200,
      total: calculatedSubtotal + 200,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 4. Persistence with Ambiguous Write and Duplicate Key Handling
    try {
      if (this.dbFailOnInsert) {
        throw new Error('Database insertion failed (simulated network down)');
      }

      if (this.ambiguousWrite) {
        // Socket broke during acknowledgment, but document was written to database
        this.orders.push(order);
        if (clientReferenceId) this.ordersByRef.set(clientReferenceId, order);
        throw new Error('MongoNetworkTimeoutError: connection timed out waiting for write acknowledgment');
      }

      if (clientReferenceId && this.ordersByRef.has(clientReferenceId)) {
        const dupErr = new Error('E11000 duplicate key error collection: orders index: clientReferenceId_1');
        dupErr.code = 11000;
        throw dupErr;
      }

      this.orders.push(order);
      if (clientReferenceId) this.ordersByRef.set(clientReferenceId, order);
    } catch (insertError) {
      // Check if order persisted despite error
      const persistedOrder = clientReferenceId ? this.ordersByRef.get(clientReferenceId) : null;

      if (persistedOrder) {
        const isDuplicateKey = insertError.code === 11000 || String(insertError.message).includes('E11000');
        if (isDuplicateKey) {
          // Rollback redundant reservation from second concurrent attempt
          for (const item of reservedItems) {
            const prod = this.products.get(item.productId);
            if (prod) prod.stock += item.quantity;
          }
        }
        // If not duplicate key (ambiguous write where order persisted), do NOT restore stock!
        if (areOrdersPayloadCompatible(persistedOrder, order)) {
          return {
            status: 200,
            body: { order: persistedOrder, success: true, notification: { ok: true, status: 'already_processed', dedupeKey: clientReferenceId } }
          };
        } else {
          return { status: 409, body: { error: 'This checkout reference was already processed with different order details.' } };
        }
      }

      // Order confirmed NOT persisted: Rollback reserved stock
      for (const item of reservedItems) {
        const prod = this.products.get(item.productId);
        if (prod) prod.stock += item.quantity;
      }
      return { status: 500, body: { error: 'Failed to record order. Please try again.' } };
    }

    // 5. Notification
    let notification = null;
    try {
      if (this.emailFail) throw new Error('Resend 503 Provider Unavailable');
      notification = { ok: true, status: 'sent', providerId: 'msg_sim_123' };
    } catch (err) {
      notification = { ok: false, status: 'failed', code: 'NOTIFICATION_EXCEPTION' };
    }

    return {
      status: 201,
      body: { order, success: true, notification }
    };
  }
}

// [MOCKED TEST 1]: Identical concurrent requests
{
  console.log('\n[MOCKED TEST 1]: Identical concurrent requests...');
  const engine = new MockOrderEngine([{ id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 }]);
  const payload = {
    clientReferenceId: 'chk_identical_concurrent',
    customer: { name: 'Siraj Ahmed', phone: '03001234567', city: 'Karachi', address: 'Street 1' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };

  const [res1, res2] = await Promise.all([engine.processOrder(payload), engine.processOrder(payload)]);
  assert.ok(res1.status === 200 || res1.status === 201);
  assert.ok(res2.status === 200 || res2.status === 201);
  assert.equal(res1.body.order._id, res2.body.order._id);
  assert.equal(engine.orders.length, 1);
  assert.equal(engine.products.get('p1').stock, 4);
  console.log('  [PASS] Identical concurrent requests result in exactly 1 order and 1 stock decrement.');
}

// [MOCKED TEST 2]: Same key with changed address or city
{
  console.log('\n[MOCKED TEST 2]: Same key with changed delivery address or city...');
  const engine = new MockOrderEngine([{ id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 }]);
  const payload1 = {
    clientReferenceId: 'chk_reused_key_addr',
    customer: { name: 'Customer A', phone: '03001234567', city: 'Karachi', address: 'Gulshan Block 5' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };
  await engine.processOrder(payload1);

  const payloadChangedAddr = {
    clientReferenceId: 'chk_reused_key_addr',
    customer: { name: 'Customer A', phone: '03001234567', city: 'Karachi', address: 'DHA Phase 6' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };
  const res = await engine.processOrder(payloadChangedAddr);
  assert.equal(res.status, 409, 'Must reject reused key with changed address');
  assert.equal(engine.products.get('p1').stock, 4, 'Stock must not be decremented for rejected request');
  console.log('  [PASS] Same key with changed address safely rejected with 409.');
}

// [MOCKED TEST 3]: Same key with changed cart items
{
  console.log('\n[MOCKED TEST 3]: Same key with changed cart items...');
  const engine = new MockOrderEngine([
    { id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 },
    { id: 'p2', name: 'BURHAN Max', stock: 5, price: 8999 }
  ]);
  const payload1 = {
    clientReferenceId: 'chk_reused_key_cart',
    customer: { name: 'Customer B', phone: '03009998877', city: 'Lahore', address: 'Model Town' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };
  await engine.processOrder(payload1);

  const payloadChangedCart = {
    clientReferenceId: 'chk_reused_key_cart',
    customer: { name: 'Customer B', phone: '03009998877', city: 'Lahore', address: 'Model Town' },
    items: [{ productId: 'p2', quantity: 1, price: 8999 }],
    subtotal: 8999,
    total: 9199
  };
  const res = await engine.processOrder(payloadChangedCart);
  assert.equal(res.status, 409);
  assert.equal(engine.products.get('p1').stock, 4);
  assert.equal(engine.products.get('p2').stock, 5, 'Second product stock untouched');
  console.log('  [PASS] Same key with changed cart safely rejected with 409.');
}

// [MOCKED TEST 4]: Uncertain insert outcome followed by retry
{
  console.log('\n[MOCKED TEST 4]: Uncertain insert outcome (socket timeout where order persisted) followed by retry...');
  const engine = new MockOrderEngine([{ id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 }]);
  engine.ambiguousWrite = true;

  const payload = {
    clientReferenceId: 'chk_ambiguous_write',
    customer: { name: 'Customer C', phone: '03005554433', city: 'Islamabad', address: 'F-7/2' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };

  // Attempt 1: Threw socket timeout, but order was persisted
  const attempt1 = await engine.processOrder(payload);
  assert.equal(attempt1.status, 200, 'Conservative recovery recognizes order persisted');
  assert.equal(engine.orders.length, 1);
  assert.equal(engine.products.get('p1').stock, 4, 'Stock decremented by 1');

  // Attempt 2: Customer retries with same key
  engine.ambiguousWrite = false;
  const attempt2 = await engine.processOrder(payload);
  assert.equal(attempt2.status, 200);
  assert.equal(attempt2.body.order._id, attempt1.body.order._id);
  assert.equal(engine.products.get('p1').stock, 4, 'Stock must NOT be restored or double-decremented');
  console.log('  [PASS] Ambiguous write did not cause stock leakage; retry returned original order.');
}

// [MOCKED TEST 5]: Confirmed DB insert failure where order did not persist
{
  console.log('\n[MOCKED TEST 5]: Confirmed DB insert failure where order did NOT persist...');
  const engine = new MockOrderEngine([{ id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 }]);
  engine.dbFailOnInsert = true;

  const payload = {
    clientReferenceId: 'chk_db_hard_fail',
    customer: { name: 'Customer D', phone: '03001112233', city: 'Multan', address: 'Cantt' },
    items: [{ productId: 'p1', quantity: 2, price: 5499 }],
    subtotal: 10998,
    total: 11198
  };

  const res = await engine.processOrder(payload);
  assert.equal(res.status, 500);
  assert.equal(engine.orders.length, 0);
  assert.equal(engine.products.get('p1').stock, 5, 'Reserved stock restored completely');
  console.log('  [PASS] Hard DB failure rolled back reserved inventory cleanly.');
}

// [MOCKED TEST 6]: Two different customers attempting to reuse same key
{
  console.log('\n[MOCKED TEST 6]: Two different customers attempting to reuse the same key...');
  const engine = new MockOrderEngine([{ id: 'p1', name: 'BURHAN Pro 2', stock: 5, price: 5499 }]);
  const payload1 = {
    clientReferenceId: 'chk_shared_key_attack',
    customer: { name: 'Legitimate Customer', phone: '03001234567', city: 'Karachi', address: 'PECHS' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };
  await engine.processOrder(payload1);

  const payload2 = {
    clientReferenceId: 'chk_shared_key_attack',
    customer: { name: 'Attacker / Unrelated', phone: '03459999999', city: 'Rawalpindi', address: 'Satellite Town' },
    items: [{ productId: 'p1', quantity: 1, price: 5499 }],
    subtotal: 5499,
    total: 5699
  };
  const res = await engine.processOrder(payload2);
  assert.equal(res.status, 409);
  assert.ok(res.body.error.includes('different order details'));
  assert.equal(res.body.order, undefined, 'Must NEVER return existing customer order details to conflicting caller');
  console.log('  [PASS] Cross-customer key reuse safely rejected without leaking order details.');
}


// =========================================================================
// SECTION 4: LOCAL RESILIENT DATA LAYER INTEGRATION TESTS
// (Testing InMemoryCollection implementation in lib/db/mongodb.js directly)
// =========================================================================
console.log('\n=============================================================');
console.log('LOCAL RESILIENT DATA LAYER INTEGRATION TESTS');
console.log('=============================================================');

import { connectToDatabase, getDatabaseStatus } from '../lib/db/mongodb.js';

{
  const { db } = await connectToDatabase();
  const ordersCol = db.collection('orders');

  console.log('\n[LOCAL INTEGRATION TEST 1]: Testing unique constraint on clientReferenceId...');
  const refKey = 'int_ref_' + Date.now();
  await ordersCol.insertOne({
    _id: 'ord_int_1',
    clientReferenceId: refKey,
    customer: { name: 'Test Int 1', phone: '03001234567' }
  });

  // Attempting second insert with same clientReferenceId must throw E11000
  let dupThrew = false;
  try {
    await ordersCol.insertOne({
      _id: 'ord_int_2',
      clientReferenceId: refKey,
      customer: { name: 'Test Int 2', phone: '03007654321' }
    });
  } catch (err) {
    dupThrew = true;
    assert.equal(err.code, 11000);
    assert.ok(err.message.includes('E11000 duplicate key error'));
  }
  assert.equal(dupThrew, true, 'Duplicate clientReferenceId must throw E11000 in local data layer');
  console.log('  [PASS] Local data layer enforces E11000 unique key constraint on clientReferenceId.');

  console.log('\n[LOCAL INTEGRATION TEST 2]: Testing sparse behavior for legacy orders without clientReferenceId...');
  // Inserting two legacy documents with missing clientReferenceId must NOT conflict
  const leg1 = await ordersCol.insertOne({ _id: 'ord_leg_1', customer: { name: 'Legacy 1' } });
  const leg2 = await ordersCol.insertOne({ _id: 'ord_leg_2', customer: { name: 'Legacy 2' } });
  assert.ok(leg1.insertedId);
  assert.ok(leg2.insertedId);
  console.log('  [PASS] Documents without clientReferenceId do not conflict (sparse compatibility).');

  console.log('\n[LOCAL INTEGRATION TEST 3]: Inspecting database diagnostics status...');
  const dbStatus = getDatabaseStatus();
  assert.ok(dbStatus.provider);
  assert.equal(typeof dbStatus.isConfigured, 'boolean');
  console.log('  [PASS] Database status diagnostic inspected: Provider =', dbStatus.provider);

  // Clean up test documents
  await ordersCol.deleteOne({ _id: 'ord_int_1' });
  await ordersCol.deleteOne({ _id: 'ord_leg_1' });
  await ordersCol.deleteOne({ _id: 'ord_leg_2' });
}

console.log('\n=============================================================');
console.log('ALL STATIC CHECKS, MOCKED TESTS, AND INTEGRATION TESTS PASSED!');
console.log('=============================================================\n');
