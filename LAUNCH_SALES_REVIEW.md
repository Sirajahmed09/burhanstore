# BURHAN STORE — launch and sales review

Review date: 27 October 2026. Base commit: 6ab0ee0.

## Verdict

The store is technically much closer to a COD launch, but a full commercial launch still needs a verified real order flow, actual product testing/stock/package checks, and a working courier arrangement. Online payment is unavailable in the repository and should not be advertised as working. No website can guarantee that every visitor purchases.

## Live observations before this update

- Home and BURHAN Pro 2 pages opened successfully.
- Health endpoint reported MongoDB configured and connected.
- Public settings supplied PKR 200 default delivery charge and configured Facebook, Instagram, TikTok and WhatsApp links.
- Pro 2 displayed PKR 2,199, an unconfirmed comparison price, 45 units, and untested performance claims.
- A SmartWatch Ultra was also visible as an active product. Confirm its real stock and availability; hide it in admin if it is a sample.
- Footer incorrectly advertised debit/credit card payment.

## Applied changes

- Installed the generated B/audio brand symbol in navigation, footer, favicon and social-share metadata; included a real social-share image instead of a broken image reference.
- Fixed the unstable product object that caused product effects/review requests to rerun on state updates. Fixed conditional navbar hooks.
- Hid unconfirmed specifications, performance/package claims, star totals and comparison-price discounts. Actual price and stock controls remain functional. Product admin now has explicit claim/previous-price confirmation checkboxes; do not check them before testing.
- Removed exact stock/warehouse promises from product presentation, unsupported card-payment footer text, empty-category navigation and unsubstantiated "top-rated" copy.
- Checkout now refreshes price and stock before ordering, applies changed cart values, blocks when verification fails, supports autofill, has visible email validation and a persistent mobile order button.
- Preserved checkout retry references on server errors and when session storage is unavailable; kept server-side COD, pricing, stock and idempotency protection.
- Added contextual WhatsApp help and checkout/support conversion events without sending customer details to analytics.
- New feedback requires approval. Added owner review moderation in admin; public ratings are published after owner approval rather than inherited seed totals.
- New product stock defaults to zero.

## Validation

Production build, real lint, actual isolated order-handler tests, 19 API contract checks, existing checkout tests, and 9 settings checks passed. New tests verify unconfirmed claims stay hidden, confirmed claims remain available, and public sanitation does not mutate admin data. Live order creation, email delivery and payment processing were not performed.

## Before launch — owner actions

1. Test the actual earbuds: charging, both channels, microphone/calls, pairing and battery duration. Confirm each package variant and take real photos. Only publish features you verified.
2. Check every active product, its actual stock and selling price. Confirm the SmartWatch listing is real. Configure delivery charges and courier coverage; confirm parcel-inspection policy.
3. Complete one authorized end-to-end COD order, verify it appears in admin, verify notifications and tracking, then close/cancel that test order correctly. Admin login and notification delivery still need live verification.
4. If accepting online payment at launch, supply/integrate the reviewed Safepay code and verify sandbox checkout, cancellation and webhook before live payments. COD can be a separate launch decision.

## First launch week

Use real product-shot videos that link directly to the product page. Check product views, add-to-cart, begin-checkout, purchases and support clicks in existing GA4. Fix the largest drop-off before spending on ads. Do not add fake reviews, countdowns, scarcity or untested feature claims.
