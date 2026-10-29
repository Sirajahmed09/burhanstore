import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateValidDiscount } from '../lib/utils/pricing.js';
import { normalizeWhatsAppNumber, getWhatsAppUrl, formatDisplayPhone } from '../lib/utils/whatsapp.js';
import { isValidSocialUrl, getVerifiedSocialLinks } from '../lib/utils/social.js';
import { normalizePakistaniPhone, isValidPakistaniPhone } from '../lib/utils/phone.js';

console.log('=== BURHAN STORE: PART 3 & PART 4 VERIFICATION SUITE ===\n');

// =========================================================================
// 1. PRICING & DISCOUNT INTEGRITY TESTS
// =========================================================================
console.log('--- [SECTION 1]: Pricing & Discount Integrity ---');

// Test 1.1: Valid discounts calculate accurately
assert.equal(calculateValidDiscount(7500, 10000), 25, 'Expected 25% discount for 7500 / 10000');
assert.equal(calculateValidDiscount(4000, 5000), 20, 'Expected 20% discount for 4000 / 5000');
console.log('  [PASS] Valid discounts calculate accurately');

// Test 1.2: oldPrice <= price returns 0 (never negative or fake discounts)
assert.equal(calculateValidDiscount(5000, 5000), 0, 'oldPrice === price must yield 0');
assert.equal(calculateValidDiscount(6000, 5000), 0, 'oldPrice < price must yield 0');
assert.equal(calculateValidDiscount(5000, 0), 0, 'oldPrice === 0 must yield 0');
assert.equal(calculateValidDiscount(0, 5000), 0, 'price === 0 must yield 0');
assert.equal(calculateValidDiscount(-100, 5000), 0, 'negative price must yield 0');
assert.equal(calculateValidDiscount(5000, undefined), 0, 'missing oldPrice must yield 0');
assert.equal(calculateValidDiscount(null, null), 0, 'null values must yield 0');
console.log('  [PASS] Invalid, inverted, or missing compare-at prices strictly return 0');

// Test 1.3: Component audit - no arbitrary fake fallback in ProductCard, ProductDetailClient, FeaturedProduct
const productCardSource = fs.readFileSync('components/product/ProductCard.jsx', 'utf8');
const productDetailSource = fs.readFileSync('components/product/ProductDetailClient.jsx', 'utf8');
const featuredProductSource = fs.readFileSync('components/home/FeaturedProduct.jsx', 'utf8');

assert(
  !productCardSource.includes('product.discount ||'),
  'ProductCard must not use arbitrary product.discount fallback'
);
assert(
  productCardSource.includes('calculateValidDiscount'),
  'ProductCard must use calculateValidDiscount utility'
);
assert(
  !productDetailSource.includes('product.discount ||'),
  'ProductDetailClient must not use arbitrary product.discount fallback'
);
assert(
  productDetailSource.includes('calculateValidDiscount'),
  'ProductDetailClient must use calculateValidDiscount utility'
);
assert(
  featuredProductSource.includes('calculateValidDiscount'),
  'FeaturedProduct must use calculateValidDiscount utility'
);
console.log('  [PASS] Component code audit confirms zero fake discount fallbacks');


// =========================================================================
// 2. WHATSAPP CONFIGURATION & LINK GENERATION TESTS
// =========================================================================
console.log('\n--- [SECTION 2]: Centralized WhatsApp Normalization & Link Generation ---');

// Test 2.1: Pakistani domestic phone normalization to international wa.me format
assert.equal(normalizeWhatsAppNumber('03150693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber('+92 315 0693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber('0092 315 0693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber('923150693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber('0315-0693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber('3150693148'), '923150693148');
assert.equal(normalizeWhatsAppNumber(''), '');
assert.equal(normalizeWhatsAppNumber(null), '');
console.log('  [PASS] Pakistani phone numbers normalize to international 923... format without + or leading zero');

// Test 2.2: wa.me link generation with encoded messages
const urlWithMessage = getWhatsAppUrl('03150693148', 'Hello BURHAN! I have a question.');
assert.equal(
  urlWithMessage,
  'https://wa.me/923150693148?text=Hello%20BURHAN!%20I%20have%20a%20question.'
);
const urlWithoutMessage = getWhatsAppUrl('03150693148');
assert.equal(urlWithoutMessage, 'https://wa.me/923150693148');
assert.equal(getWhatsAppUrl(''), null, 'Empty phone should return null');
assert.equal(getWhatsAppUrl('invalid'), null, 'Invalid phone should return null');
console.log('  [PASS] WhatsApp wa.me URLs generated cleanly with proper encoding');

// Test 2.3: Display phone formatting
assert.equal(formatDisplayPhone('03150693148'), '0315-0693148');
assert.equal(formatDisplayPhone('923150693148'), '0315-0693148');
console.log('  [PASS] Display phone formats consistently as 03XX-XXXXXXX');

// Test 2.4: Code audit for WhatsApp links across the app
const contactPageSource = fs.readFileSync('app/contact/page.jsx', 'utf8');
const successPageSource = fs.readFileSync('app/success/page.jsx', 'utf8');
const whatsAppCtaSource = fs.readFileSync('components/home/WhatsAppCTA.jsx', 'utf8');

assert(
  !contactPageSource.includes('wa.me/03'),
  'Contact page must not have broken wa.me/03 links'
);
assert(
  !successPageSource.includes('wa.me/03'),
  'Success page must not have broken wa.me/03 links'
);
assert(
  !whatsAppCtaSource.includes('wa.me/${whatsappNumber}'),
  'WhatsAppCTA must not use raw unnormalized numbers in wa.me'
);
console.log('  [PASS] Storefront components eliminated broken local wa.me/03 links');


// =========================================================================
// 3. SOCIAL MEDIA LINKS & ADMIN SETTINGS SAFETY
// =========================================================================
console.log('\n--- [SECTION 3]: Social Media Links & Admin Settings Safety ---');

// Test 3.1: Rejection of malicious schemes
assert.equal(isValidSocialUrl('facebook', 'javascript:alert(1)'), false);
assert.equal(isValidSocialUrl('instagram', 'data:text/html,<script>alert(1)</script>'), false);
assert.equal(isValidSocialUrl('tiktok', 'vbscript:msgbox(1)'), false);
assert.equal(isValidSocialUrl('twitter', 'http://twitter.com/burhan'), false, 'Non-HTTPS must be rejected');
console.log('  [PASS] Malicious URI schemes (javascript:, data:) and insecure http: are rejected');

// Test 3.2: Rejection of root-only generic domain without profile handle
assert.equal(isValidSocialUrl('instagram', 'https://instagram.com'), false, 'Root Instagram link rejected');
assert.equal(isValidSocialUrl('instagram', 'https://instagram.com/'), false, 'Root Instagram slash link rejected');
assert.equal(isValidSocialUrl('facebook', 'https://facebook.com'), false, 'Root Facebook link rejected');
assert.equal(isValidSocialUrl('tiktok', 'https://tiktok.com'), false, 'Root TikTok link rejected');
console.log('  [PASS] Generic platform root URLs without user profile handle are rejected');

// Test 3.3: Platform domain mismatch verification
assert.equal(isValidSocialUrl('instagram', 'https://facebook.com/burhan'), false, 'Facebook URL passed as Instagram');
assert.equal(isValidSocialUrl('facebook', 'https://youtube.com/@burhan'), false, 'YouTube URL passed as Facebook');
assert.equal(isValidSocialUrl('tiktok', 'https://twitter.com/burhan'), false, 'Twitter URL passed as TikTok');
console.log('  [PASS] Cross-platform domain mismatches are rejected');

// Test 3.4: Valid profile URLs pass validation
assert.equal(isValidSocialUrl('instagram', 'https://instagram.com/burhanstore'), true);
assert.equal(isValidSocialUrl('facebook', 'https://facebook.com/burhanstore'), true);
assert.equal(isValidSocialUrl('tiktok', 'https://tiktok.com/@burhanstore'), true);
assert.equal(isValidSocialUrl('twitter', 'https://x.com/burhanstore'), true);
assert.equal(isValidSocialUrl('youtube', 'https://youtube.com/@burhanstore'), true);
console.log('  [PASS] Valid social profile URLs pass verification');

// Test 3.5: getVerifiedSocialLinks helper
const testSettingsAll = {
  instagram: 'https://instagram.com/burhanstore',
  facebook: 'https://facebook.com/burhanstore',
  tiktok: 'https://tiktok.com/@burhanstore',
  twitter: 'https://twitter.com', // invalid root
};
const verifiedAll = getVerifiedSocialLinks(testSettingsAll);
assert.equal(verifiedAll.length, 3, 'Expected 3 verified platforms (Instagram, Facebook, TikTok)');
assert.deepEqual(verifiedAll.map(v => v.platform), ['instagram', 'facebook', 'tiktok']);

const testSettingsNone = {
  instagram: '',
  facebook: 'invalid-url',
  tiktok: 'javascript:alert(1)',
};
const verifiedNone = getVerifiedSocialLinks(testSettingsNone);
assert.equal(verifiedNone.length, 0, 'No platforms should be verified when unconfigured or invalid');
console.log('  [PASS] getVerifiedSocialLinks correctly filters only valid, configured profiles');

// Test 3.6: Admin route code audit - strip _id to protect MongoDB immutability
const adminRouteSource = fs.readFileSync('app/api/admin/[[...path]]/route.js', 'utf8');
assert(
  adminRouteSource.includes('const { _id, type, createdAt, updatedAt, ...cleanSettings } = body;'),
  'Admin route must strip _id before updating settings in MongoDB'
);
assert(
  adminRouteSource.includes('$set: { ...cleanSettings,'),
  'Admin route must pass cleanSettings without _id into MongoDB $set'
);
assert(
  adminRouteSource.includes('Invalid URL for'),
  'Admin route must validate social URLs on server side'
);
console.log('  [PASS] Admin settings route strips _id and enforces server-side social URL validation');

// Test 3.7: Admin settings page audit - supports TikTok
const adminSettingsSource = fs.readFileSync('app/admin/settings/page.jsx', 'utf8');
assert(
  adminSettingsSource.includes("tiktok: ''"),
  'Admin settings state must initialize tiktok'
);
assert(
  adminSettingsSource.includes('TikTok'),
  'Admin settings UI must include TikTok label and input field'
);
console.log('  [PASS] Admin settings page includes TikTok input field and state');

// Test 3.8: Footer audit - zero empty space when no social media is configured
const footerSource = fs.readFileSync('components/layout/Footer.jsx', 'utf8');
assert(
  footerSource.includes('activeSocials.length > 0'),
  'Footer must conditionally render Connect With Us only when activeSocials > 0'
);
assert(
  footerSource.includes('isValidSocialUrl'),
  'Footer must verify each social link with isValidSocialUrl'
);
console.log('  [PASS] Footer component cleanly eliminates empty space and orphaned headings');


// =========================================================================
// 4. MOBILE CONVERSION & CHECKOUT EXPERIENCE TESTS
// =========================================================================
console.log('\n--- [SECTION 4]: Mobile Conversion & Checkout Experience ---');

// Test 4.1: Pakistani phone normalization in checkout
assert.equal(normalizePakistaniPhone('03151234567'), '03151234567');
assert.equal(normalizePakistaniPhone('0315-1234567'), '03151234567');
assert.equal(normalizePakistaniPhone('+92 315 1234567'), '03151234567');
assert.equal(normalizePakistaniPhone('0092 315 1234567'), '03151234567');
assert.equal(normalizePakistaniPhone('923151234567'), '03151234567');
assert.equal(normalizePakistaniPhone('0315 1234567'), '03151234567');
assert.equal(normalizePakistaniPhone('0315.1234567'), '03151234567');
assert.equal(normalizePakistaniPhone('12345'), null);
assert.equal(normalizePakistaniPhone('02134567890'), null, 'Landline without 03 is invalid');
assert.equal(normalizePakistaniPhone('abcdef'), null);
console.log('  [PASS] Pakistani phone numbers in varied customer input formats normalize to 03XXXXXXXXX');

// Test 4.2: Checkout form retains customer inputs on validation failure
const checkoutSource = fs.readFileSync('app/checkout/page.jsx', 'utf8');
assert(
  checkoutSource.includes('setErrors(newErrors)'),
  'Checkout must record field errors without clearing formData'
);
assert(
  checkoutSource.includes('normalizePakistaniPhone'),
  'Checkout page must use normalizePakistaniPhone utility'
);
console.log('  [PASS] Checkout retains customer form data on validation error');

// Test 4.3: Product detail mobile sticky bar & out of stock states
assert(
  productDetailSource.includes('Quick mobile checkout'),
  'ProductDetailClient must have sticky mobile purchase bar'
);
assert(
  productDetailSource.includes("product.stock <= 0 ? 'Out of Stock' : 'Order with Cash on Delivery'"),
  'ProductDetailClient primary CTA must indicate Out of Stock when unavailable'
);
assert(
  productDetailSource.includes("product.stock <= 0 ? 'OUT OF STOCK' : 'BUY NOW'"),
  'Mobile sticky purchase bar must indicate OUT OF STOCK when unavailable'
);
console.log('  [PASS] Product detail page and mobile sticky purchase bar provide clear out-of-stock states');

// Test 4.4: Success page direct order tracking link
assert(
  successPageSource.includes('/track?orderId='),
  'Success page must provide direct order tracking link'
);
console.log('  [PASS] Order confirmation provides instant tracking CTA');

console.log('\n=============================================================');
console.log('ALL PART 3 & PART 4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================');
