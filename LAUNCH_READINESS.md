# BURHAN STORE launch preparation — 27 October 2026

Base: `main` at `bb929b7af4388f6f90ab323a1aa4d203b4f13084`.

## Changes

- Removed unsupported card-on-delivery/POS selection. Checkout and the order API accept COD only. Online payment remains unavailable because this repository does not contain the Safepay implementation described in earlier reports.
- Delivery charges use one shared resolver in checkout and the server. Default remains PKR 200 unless configured otherwise. Owner settings support optional province and city rates; city takes precedence, then province, then default. Zero-cost rules are supported and invalid/duplicate rules are rejected.
- Added Pakistani phone validation, city/province/address checks, integer quantity limits, positive server-side prices, and rejection of unsupported payment methods.
- Accepted order retries are recovered before current stock validation, including orders that reserved the final unit. Retry identity includes province and payment method. Frontend uses a synchronous submission lock.
- Removed six-month warranty, authenticity, express delivery, invented testimonials and fictional featured-product fallbacks. Existing database product copy is filtered on public API and rendering surfaces without modifying production records. Delivery estimate is 2–5 business days. Parcel-opening promises were replaced by guidance to confirm courier policy.
- Default product-form warranty duration is blank. Metadata and product support copy were updated. Hidden products are excluded from direct product pages.
- Private product fields are removed from server-rendered props and search suggestions. JSON-LD escapes HTML delimiters. API pagination is bounded.
- Replaced the no-op lint command with checks for undefined identifiers, unreachable code and duplicate object keys. Intro duration is two seconds.

## Validation

- `npm run lint`
- `npm run test:launch`: actual public order handler executed against isolated collections; shipping precedence/validation, price tampering, invalid payments/quantities/phones, successful COD and sold-out retry recovery.
- `npm run test:checkout`: existing static, mocked and local integration checks.
- `npm run test:settings`: 9/9 existing checks.
- `node scripts/test-api-contracts.mjs`: 17/17 source contract checks.
- `node scripts/test-cinematic-intro.mjs`
- Production build.

These checks do not prove live gateway operation, courier availability, product performance or production database state. Local test data changes were restored and are excluded from this change.

## Remaining release checks

1. Review the preview on mobile and desktop; browser automation could not run because the Chromium download failed in this environment.
2. Verify the deployment's MongoDB, admin login, configured contact details and notification delivery. Confirm actual stock, prices, package contents and product specifications before accepting orders.
3. Confirm COD courier service and delivery charges for supported areas, and verify an authorized end-to-end order before public marketing.
4. Online-payment release requires bringing in the reviewed Safepay implementation, configuring its environment and webhook, and verifying the sandbox flow before live payments.

No production deployment, production database writes or live test orders were made. This branch prepares a COD release; it is not a claim that the live website is fully launch-verified.
