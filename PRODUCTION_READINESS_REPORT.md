# BURHAN STORE — Production Readiness & Architecture Report

**Version:** 1.0.0 (Production Hardened)  
**Date:** September 2026  
**Audited & Certified by:** Senior Principal Full-Stack Engineer  
**Status:** PRODUCTION READY  

---

## 1. Executive Summary

BURHAN STORE (`burhanstore.com`) is a full-stack, enterprise-grade e-commerce platform built for high-performance consumer electronics retail. The platform features a customer-facing storefront, shopping cart and checkout pipeline tailored for Pakistan (Cash on Delivery & Mobile Wallets), real-time order tracking, and a comprehensive administrative suite with role-based access control, analytics, product catalog management, and order lifecycle processing.

This report documents the architectural audit, critical fixes implemented across database persistence and API routing, security hardening, and operational procedures for production deployment.

---

## 2. System Architecture & Topology

```
+---------------------------------------------------------------------------------+
|                                CLIENT LAYER                                     |
|  Next.js 15 App Router (React 19, Tailwind CSS, Lucide Icons, Framer Motion)    |
|  - Customer Storefront: /, /shop, /shop/[slug], /cart, /checkout, /track, /success|
|  - Admin Dashboard: /admin/dashboard, /admin/products, /admin/orders, /admin/login|
+----------------------------------------+----------------------------------------+
                                         | HTTP / REST (Fetch API / JSON)
                                         v
+---------------------------------------------------------------------------------+
|                                 EDGE & ROUTING                                  |
|  Root Middleware (middleware.js)                                                |
|  - Guard /admin routes via JWT HTTP-only cookies                                 |
|  - Enforce SSL & Security Headers (Strict-Transport-Security, X-Frame-Options)  |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                               API SERVICES LAYER                                |
|  Next.js Server API Catch-all Routes:                                           |
|  - /api/[[...path]]: Customer Endpoints (Products, Categories, Orders, Track)  |
|  - /api/admin/[[...path]]: Admin Endpoints (Auth, Dashboard Stats, CRUD, Status)|
|  - /api/health & /api/admin/health: Health checks & DB connection metrics       |
+----------------------------------------+----------------------------------------+
                                         | Connection Pool with Global Caching
                                         v
+---------------------------------------------------------------------------------+
|                             DATA & PERSISTENCE LAYER                            |
|  lib/db/mongodb.js                                                              |
|  - Production Engine: MongoDB Atlas via official `mongodb` Native Client Driver  |
|  - Serverless Optimization: `global.__mongoClientPromise` connection pooling    |
|  - Type-safe Query Engine: Interoperable ObjectId and string key matching       |
|  - Local/Dev Fallback: Persistent in-memory collection cache with file fallback |
+---------------------------------------------------------------------------------+
```

---

## 3. Critical Audit Findings & Resolutions

### 3.1. Transient Build Module Error (`./331.js`)
* **Root Cause:** Next.js development server running concurrently with standalone production webpack builds (`next build`) caused race conditions in `.next/server/chunks` where temporary chunk IDs were referenced before being flushed to disk.
* **Resolution:** Synchronized the build lifecycle, ensured clean caching in `.next`, and verified production builds compile with zero warnings or dangling chunk references.

### 3.2. Database Connection Pooling & Serverless Stability
* **Root Cause:** In serverless runtime environments (such as Vercel or container auto-scalers), naive calls to `MongoClient.connect()` create a new connection per incoming request, quickly saturating MongoDB Atlas connection pools and causing ECONNRESET/ETIMEDOUT.
* **Resolution:** Implemented the official global client promise caching pattern (`global.__mongoClientPromise`). The client is initialized once and reused across warm serverless lambdas.

### 3.3. MongoDB ObjectId vs. String ID Query Mismatch
* **Root Cause:** In MongoDB, documents created via the MongoDB native driver have `_id` stored as `ObjectId`, whereas client requests send hexadecimal or UUID strings. Standard equality queries `{ _id: id }` failed to match documents, leading to "Product not found" or "Order not found" false negatives.
* **Resolution:** Hardened `matchCondition` in `lib/db/mongodb.js` to automatically compare string representations and cast strings to `ObjectId` safely when applicable.

### 3.4. Administrative Authentication: Dual Header & Cookie Verification
* **Root Cause:** The admin verification middleware only read the `admin_token` cookie. Programmatic API calls and automated test clients sending standard `Authorization: Bearer <token>` headers were rejected with HTTP 401.
* **Resolution:** Enhanced `requireAuth()` to check:
  1. NextRequest parsed cookie (`admin_token`)
  2. Raw `Cookie` HTTP header fallback
  3. `Authorization: Bearer <token>` HTTP header
  Both browser sessions and programmatic clients now authenticate seamlessly.

### 3.5. Order Tracking & Status Update Sync
* **Root Cause:** Customer order tracking (`POST /api/orders/track` and `GET /api/orders/track`) expected inconsistent payload schemas. Admin status changes did not handle both `POST` and `PUT` methods.
* **Resolution:** Aligned order tracking to accept both Order ID and Customer Phone for verification, and added both `POST` and `PUT` handlers to `/api/admin/orders/[id]/status`.

---

## 4. Security & Hardening Architecture

1. **Authentication:**
   - Stateless JWT tokens signed with HMAC-SHA256 and verified using `JWT_SECRET`.
   - Admin passwords hashed using industry-standard `bcrypt` with 10 salt rounds, with secure `scrypt` fallback.
2. **Brute Force Defense:**
   - Built-in rate-limiting tracks failed login attempts. After 5 consecutive failures, the identifier is locked out for 15 minutes with HTTP 429.
3. **Session Cookies:**
   - `admin_token` cookie is marked `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production environments.
4. **Data Validation:**
   - All checkout orders require complete customer information (Full Name, valid Pakistani phone format `03XXXXXXXXX`, complete address, city, and province).
   - Input sanitization prevents NoSQL injection and malformed query payloads.

---

## 5. End-to-End Verification Matrix

| Flow | Endpoint / Action | Expected Result | Verified Status |
|---|---|---|---|
| **Health Check** | `GET /api/health` | 200 OK with DB status | **PASS** |
| **Catalog Browsing** | `GET /api/products` | 200 OK, returns active products | **PASS** |
| **Product Detail** | `GET /api/products/[slug]` | 200 OK with specs & images | **PASS** |
| **Checkout Placement**| `POST /api/orders` | 201 Created with order UUID | **PASS** |
| **Order Tracking** | `POST /api/orders/track` | 200 OK with history & customer info | **PASS** |
| **Admin Login** | `POST /api/admin/auth/login` | 200 OK, issues token & cookie | **PASS** |
| **Admin Order List** | `GET /api/admin/orders` | 200 OK, lists recent orders | **PASS** |
| **Status Transition** | `POST /api/admin/orders/[id]/status`| 200 OK, transitions to confirmed | **PASS** |
| **Tracking Refresh** | `POST /api/orders/track` | 200 OK, shows 'confirmed' status | **PASS** |
| **Admin Create Prod** | `POST /api/admin/products` | 201 Created with new ID | **PASS** |
| **Admin Update Prod** | `PUT /api/admin/products/[id]` | 200 OK, updates price/stock | **PASS** |
| **Admin Delete Prod** | `DELETE /api/admin/products/[id]`| 200 OK, deletes product | **PASS** |

---

## 6. Production Deployment & Operational Runbook

### 6.1. Environment Variables Configuration

Set the following variables in the production environment (e.g., Vercel Project Settings or Cloud Run Environment):

```env
# MongoDB Atlas Connection URI (Required for persistent multi-instance deployment)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/burhanstore?retryWrites=true&w=majority

# Secret for Administrative JWTs (Minimum 32 random characters)
JWT_SECRET=production-burhan-store-high-entropy-jwt-secret-key-998877

# Public Store Domain
NEXT_PUBLIC_BASE_URL=https://burhanstore.com

# Node Environment
NODE_ENV=production
```

### 6.2. Administrative Access
* **Default Admin Account:** `admin@burhan.com`
* **Default Password:** `Admin@123`
* **Security Recommendation:** Upon first login in production, navigate to the settings page and update the administrative password.

### 6.3. Monitoring & Maintenance
* Monitor service health via `https://burhanstore.com/api/health`.
* The database health check reports connection status, active collections, and response latency.
* Database backups should be scheduled directly via MongoDB Atlas automated daily snapshots.
