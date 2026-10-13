import fs from 'fs';

const files = {
  productRoute: fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8'),
  productForm: fs.readFileSync('components/admin/ProductForm.jsx', 'utf8'),
  checkout: fs.readFileSync('app/checkout/page.jsx', 'utf8'),
  publicRoute: fs.readFileSync('app/api/[[...path]]/route.js', 'utf8'),
};

const checks = [
  { name: 'Product approval branch returns HTTP 202', passed: files.productRoute.includes('}, 202);') },
  { name: 'Product approval response identifies approvalRequired', passed: files.productRoute.includes('approvalRequired: true') },
  { name: 'Product direct-update response returns updated product', passed: files.productRoute.includes("message: 'Product updated successfully'") && files.productRoute.includes('product: updatedProduct') },
  { name: 'Product form distinguishes approval response', passed: files.productForm.includes('if (data.approvalRequired)') },
  { name: 'Checkout posts to the public orders endpoint', passed: files.checkout.includes("fetch('/api/orders'") },
  { name: 'Public order API inserts into the orders collection', passed: files.publicRoute.includes("getCollection('orders')") && files.publicRoute.includes('ordersCol.insertOne(order)') },
  { name: 'Public order API validates customer and item fields', passed: files.publicRoute.includes('body.items') && files.publicRoute.includes('body.customer') },
  { name: 'Public order API recalculates price from the product record', passed: files.publicRoute.includes('productsCol.findOne(buildIdQuery(prodId))') && files.publicRoute.includes('Number(product.price) * requestedQty') },
  { name: 'Admin order API reads the orders collection', passed: files.productRoute.includes("getCollection('orders')") && files.productRoute.includes('ordersCol.find(filter)') },
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
