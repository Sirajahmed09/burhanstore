import fs from 'fs';

const files = {
  productRoute: fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8'),
  productForm: fs.readFileSync('components/admin/ProductForm.jsx', 'utf8'),
  checkout: fs.readFileSync('app/checkout/page.jsx', 'utf8'),
  publicRoute: fs.readFileSync('app/api/[[...path]]/route.js', 'utf8'),
  shopContent: fs.readFileSync('components/shop/ShopContent.jsx', 'utf8'),
};

const checks = [
  { name: 'Product approval branch returns HTTP 202', passed: files.productRoute.includes('}, 202);') },
  { name: 'Product approval response identifies approvalRequired', passed: files.productRoute.includes('approvalRequired: true') },
  { name: 'Product direct-update response returns updated product', passed: files.productRoute.includes("message: 'Product updated successfully'") && files.productRoute.includes('product: updatedProduct') },
  { name: 'Product form distinguishes approval response', passed: files.productForm.includes('if (data.approvalRequired)') },
  { name: 'Checkout posts to the public orders endpoint', passed: files.checkout.includes("fetch('/api/orders'") },
  { name: 'Public order API inserts into the orders collection', passed: files.publicRoute.includes("getCollection('orders')") && files.publicRoute.includes('ordersCol.insertOne(order)') },
  { name: 'Public order API validates customer and item fields', passed: files.publicRoute.includes('body.items') && files.publicRoute.includes('body.customer') },
  { name: 'Public order API recalculates price from the product record', passed: files.publicRoute.includes('productsCol.findOne(buildIdQuery(prodId))') && files.publicRoute.includes("resolveColourSelection(product, item.variantId ?? '')") && files.publicRoute.includes('Math.round(selection.price * 100) * quantity') },
  { name: 'Checkout coalesces duplicate products before stock validation', passed: files.publicRoute.includes('quantitiesByProduct') && files.publicRoute.includes('productsById') },
  { name: 'Checkout reserves stock with an atomic quantity predicate', passed: files.publicRoute.includes('stock: { $gte: item.quantity }') && files.publicRoute.includes('reservedItems') },
  { name: 'Receipt endpoint does not return customer PII', passed: files.publicRoute.includes('expose customer PII') && !files.publicRoute.includes('phone: order.customer?.phone') && !files.publicRoute.includes('address: order.customer?.address') },
  { name: 'Order confirmation notification runs after persistence', passed: files.publicRoute.includes('await ordersCol.insertOne(order)') && files.publicRoute.includes("notifyOrderCustomer(order, 'order_confirmation')") },
  { name: 'Admin status transitions use centralized lifecycle validation', passed: files.productRoute.includes('validateOrderStatusTransition') },
  { name: 'Shipping requires saved shipment details', passed: files.productRoute.includes('Shipment details must be saved before marking this order as shipped') },
  { name: 'Manual shipment endpoint validates and persists tracking details', passed: files.productRoute.includes('validateShipmentDetails(body)') && files.productRoute.includes('ORDER_SHIPMENT_UPDATED') },
  { name: 'Customer tracking returns shipment details without private phone/address', passed: files.publicRoute.includes('sanitizeTrackedOrder') && files.publicRoute.includes('trackingUrl') && files.publicRoute.includes("city: order.customer?.city") },
  { name: 'Admin order API reads the orders collection', passed: files.productRoute.includes("getCollection('orders')") && files.productRoute.includes('ordersCol.find(filter)') },
  { name: 'Health endpoint probes the real database connection', passed: files.publicRoute.includes('await connectToDatabase()') && files.publicRoute.includes("status: 'unhealthy'") },
  { name: 'Shop catalogue distinguishes API failure from an empty result', passed: files.shopContent?.includes('catalogueError') },
];

let failed = 0;
for (const check of checks) {
  if (check.passed) console.log(`[PASS] ${check.name}`);
  else {
    failed++;
    console.error(`[FAIL] ${check.name}`);
  }
}

console.log(`\n=== RESULTS: ${checks.length - failed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
