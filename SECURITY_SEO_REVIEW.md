# BURHAN STORE — security and technical SEO

27 October 2026. Baseline: `0fbdb57`.

## Safepay status

Safepay credit/debit-card integration is not present in the current repository. No working card payment is advertised or enabled. Hosted checkout must be integrated and verified with configured merchant credentials and authenticated webhooks before live acceptance. No real payment was attempted.

## Security fixes

- Admin middleware now verifies HS256 session signatures and expiry; an arbitrary cookie no longer opens the panel.
- Anonymous visitors receive 404 for admin pages and admin APIs, including the login page. A private staff-entry link sets a signed, HTTP-only, seven-day gate cookie and redirects to the normal login. The entry cookie does not grant dashboard access. A real active account and password are still required. The private key is delivered separately; only its SHA-256 verifier is in source.
- Current authenticated admins keep access. API authorization reads current database roles and account status. Password resets increment session versions, revoking old API sessions. Gate cookies invalidate when the verifier is rotated.
- Removed public initial-admin endpoint, public login auto-bootstrap and real-database default owner-account seeding. Existing production accounts/passwords were preserved; review and remove unused accounts and replace legacy/default passwords through owner controls.
- Persistent MongoDB login/order/review/tracking throttling uses atomic unique inserts and expiring records. Keys contain HMAC identifiers, not raw phones/IPs. Database failures fail closed.
- New-order limits: 3 new orders per normalized phone per 15 minutes; 8 per IP per 15 minutes. General order requests have a separate 60-per-15-minute limit. Valid idempotent retries recover existing orders before new-order throttling.
- Retail checkout permits at most 5 total units, at most 3 per product and PKR 50,000 order value; bulk customers contact the store. Honeypot and cryptographic checkout reference added. No stock is reserved for a rejected bulk order.
- Optional Cloudflare Turnstile widget and server-side validation are implemented. Activation requires BOTH `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Hostname and action are checked. The secret is never public. Activation and a real challenge are not verified.
- JSON content type, origin, actual streamed body size, nesting and operator-key checks protect mutation endpoints. Search input is treated literally and pagination is bounded.
- Product/category/review responses use public field allowlists. Receipt totals require a random order-specific token; tracking requires a complete phone and a 12+ character order reference. Tracking no longer scans all orders or returns staff timeline notes.
- Generic API errors replace database exception messages. Arbitrary client context/stacks/query strings are not persisted. Admin pages are excluded from analytics and public analytics strips query strings.
- Image uploads now require catalogue permissions, enforce image type/size/pixel limits, reject malformed bytes instead of saving raw content, and use a generic error response. Serverless image-storage fallback no longer fails before it can run. Isolated upload rejection tests and Sharp decoding passed.
- Added HSTS, frame denial and restrictive object/base/form directives; removed unnecessary CORS permission headers.

## Dependency remediation

The production dependency audit initially reported 1 critical and 5 high findings. Patched Next.js 15.5.28, Axios 1.21.0, Sharp 0.35.5, Zod 4.6.7, follow-redirects 1.16.1 and PostCSS 8.5.23. A fresh npm lockfile replaces the obsolete Bun lock; npm clean install and build are checked. Production `npm audit --omit=dev` reports zero known findings at review time. This does not establish absence of undiscovered vulnerabilities.

## Technical SEO

- Unique product titles/descriptions reflect actual product name and selling price; verified custom content is respected.
- Search/filter catalogue URLs are noindex with the main shop canonical.
- Hidden products, empty categories and tracking pages are excluded from the sitemap.
- Admin, staff-entry, API, tracking, checkout, wishlist and confirmation surfaces are excluded from indexing.
- Product/organization/breadcrumb structured data retained, with correct logo/currency and no invented 365-day price validity.
- Added brand web manifest. Existing social-share image and icons are retained.

## Validation and limits

Real lint, production build, isolated security/order-handler tests, existing checkout/settings/email tests and API contracts are run. Security tests cover forged/expired cookies, staff-gate versus admin-session separation, disabled-account/session-version revocation, concurrent rate limits, fail-closed database errors, payload/origin/operator rejection, receipt privacy, bulk limits, CAPTCHA rejection and response allowlists.

No real order, real card transaction, credential reset or deletion of production staff accounts was performed. Existing default accounts, actual employee identities, Vercel environment secrets, real payment verification, Search Console ownership/submission and production WAF/CAPTCHA activation still require account-specific verification. Rate limits reduce abuse; attackers can rotate devices/IPs/phones. Stronger verification requires an activated challenge and, if needed, phone OTP or manual order confirmation.
