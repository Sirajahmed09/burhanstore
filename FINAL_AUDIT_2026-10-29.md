# BURHAN STORE corrective changes — 29 October 2026

This change improves checkout recovery and storefront accuracy.

- Cart validation stops loading on timeout and ignores stale requests.
- Accepted orders continue to confirmation when browser storage is unavailable.
- Order insertion recovery preserves stock reservation ownership and holds inventory when the database outcome cannot be determined. Unresolved holds require operator reconciliation.
- Zero delivery fees are preserved in receipt displays and analytics.
- Confirmation pages handle missing receipts and offline saved receipts accurately.
- Invalid intro comparison prices stay hidden.
- Tracking labels and reference-only links are corrected.
- Courier FAQs avoid unsupported numerical coverage claims.
- Source-contract checks are updated for existing colour and settings behavior.

Validation: production build, ESLint, 19 script suites and production dependency audit passed. New regressions exercise actual route handlers and compiled checkout/confirmation components using isolated synthetic data. Changed UI browser preview was unavailable; browser checks covered the existing deployment. No live order or payment was made.
