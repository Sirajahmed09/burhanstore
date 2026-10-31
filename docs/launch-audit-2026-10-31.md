# Launch audit repairs — 31 October 2026

Base: main at 6460d5b379fc23ec6a980a38cb4eec24ca26901f. These are source changes prepared for review, not a production deployment or a completed real-order certification.

## Repaired

- Order insert failure recovery now determines reservation ownership using the saved order ID. An unavailable lookup or ambiguous write with an empty lookup retains inventory and returns 503 instead of restoring potentially committed stock. Only a definitive rejection (duplicate-key/document-validation) with a successful empty lookup can release the reservation.
- Cart-validation timeouts finish the loading state and expose a retry action. Stale responses are ignored after effect cleanup.
- Once the server accepts an order, blocked session storage no longer converts acceptance into a reported network failure. The customer sees the accepted full reference and a tracking link if the receipt cannot be stored.
- The success page confirms only a receipt verified by the token-protected API, handles missing/invalid IDs and network timeouts, uses authoritative server totals, and does not count failed lookups as purchases. Analytics/storage failures do not hide valid receipts.
- Free delivery remains zero in both current and legacy receipts; order references are no longer truncated or case-changed.
- The contact form opens the configured WhatsApp channel with a draft. It explicitly tells customers that they must press Send in WhatsApp and never claims an unsent message was received. Contact labels are associated with inputs; email and phone reflect store settings.
- Tracking waits for both reference and phone; packed/returned/refunded states have accurate labels, and shipped is described as in transit, not out for delivery.
- The intro preserves a missing comparison price, hides invalid discounts, and uses an h2 beneath the page's main h1.
- follow-redirects override and lockfile updated from 1.16.1 to 1.16.2.
- Updated stale source-contract assertions for colour pricing, variant cart keys, settings sanitization, and the current COD CTA. Added actual component and order-handler regression coverage.

## Validation

- Next.js production build: passed.
- ESLint: passed.
- All 19 local test scripts passed after updating stale assertions. The navigation script's optional localhost checks were unavailable; its source checks passed. These are not a real-device/browser or production integration test suite.
- Actual handler fault injection covers saved-own-order timeouts, misleading duplicate errors, another attempt's winning order, unavailable persistence lookup, empty reads after an ambiguous timeout, and definitive validation rejection.
- Actual compiled component tests cover missing/unauthorized receipts, authoritative server totals, storage failure after acceptance, cart timeout and retry.
- npm audit --omit=dev: zero known production dependency advisories at scan time. This is not a claim of complete security certification.
- Tests used isolated synthetic data and no live MongoDB, payment or email credentials. The local test fixture was restored after testing.

## Remaining launch gates

1. Approve/review these changes and deploy them through the store's normal release process, then verify on a real phone and desktop.
2. Complete one controlled order through confirmation, owner/admin view, customer notification, courier handoff and tracking. This audit placed no live order and sent no message.
3. Decide the intended payment launch mode. The inspected store is COD-only. Safepay source integration, merchant activation, production configuration and verified payment/webhook/refund flows are not certified by this patch. Do not advertise online payments until that flow works.
4. Verify actual units, photos, battery/ANC/ENC/IP claims, physical colour inventory, packaging, delivery service areas/fees and replacement terms. No product data, prices, stock, policy commitments or merchant secrets were changed.
5. Confirm support inbox delivery and consistent policy contact information. This patch uses configured contact details but does not prove the mailbox is monitored.

## Inventory recovery limitation and operator procedure

The existing checkout uses separate MongoDB inventory and order writes, not a transaction. This patch closes the demonstrated overselling path; it does not make the entire order flow transactional. A prolonged database failure can leave stock reserved without a confirmed order. Retrying must reuse the same checkout reference and details; unresolved cases need reconciliation before adjusting inventory.

When server logs contain ORDER_RECONCILIATION_REQUIRED, use the logged orderId/clientReferenceId to inspect MongoDB after it is healthy. If that exact order committed, retain its reservation. If a different order owns the reference or no order committed, reconcile the redundant/orphan reservation against the affected products and other orders before restoring quantities. Never blindly increment stock or create a second order. Keep this operational check in the launch test; do not describe these edge cases as automatically reconciled.

Production code, production data/settings, Safepay configuration, and public deployment were not changed by this repair work.
