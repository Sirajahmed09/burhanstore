# Burhan Admin Panel Documentation

## 🔐 Access

**Admin Login URL:** `/admin/login`

**Default Credentials:**
- Email: `admin@burhan.com`
- Password: `Admin@123`

> ⚠️ **Important:** Change the default password immediately after first login in production.

## 📊 Admin Features

### 1. Dashboard (`/admin/dashboard`)
- **Real-time Statistics:**
  - Today's Revenue
  - Total Revenue
  - Pending Orders
  - Completed Orders
  - Cancelled Orders
  - Total Products
  - Low Stock Products (< 10 units)
  - Total Orders

- **Quick Actions:**
  - Navigate to Products Management
  - Navigate to Orders Management
  - Navigate to Categories Management

### 2. Products Management (`/admin/products`)
- **View All Products:**
  - Product name, image, SKU
  - Category
  - Price (current and old price)
  - Stock levels with color-coded badges
  - Status badges (Featured, Trending, New)

- **Product Actions:**
  - ✅ View product on storefront
  - ✅ Edit product details
  - ✅ Delete product
  - ✅ Search products by name or category

- **Stock Management:**
  - Visual indicators for stock levels:
    - Green: > 10 units (Good Stock)
    - Yellow: 1-10 units (Low Stock)
    - Red: 0 units (Out of Stock)

### 3. Orders Management (`/admin/orders`)
- **Order Overview:**
  - Order ID (short format)
  - Customer name and phone
  - Order date
  - Total amount and item count
  - Payment method
  - Current status

- **Order Status Workflow:**
  1. **Pending** - New order placed
  2. **Confirmed** - Order confirmed
  3. **Processing** - Being prepared
  4. **Packed** - Ready for shipment
  5. **Shipped** - Out for delivery
  6. **Delivered** - Successfully delivered
  7. **Cancelled** - Order cancelled
  8. **Returned** - Product returned
  9. **Refunded** - Money refunded

- **Features:**
  - ✅ Filter orders by status
  - ✅ Search by Order ID, customer name, or phone
  - ✅ Update order status with dropdown
  - ✅ View full order details
  - ✅ Automatic timeline updates

### 4. Categories Management (`/admin/categories`)
- **Category Operations:**
  - ✅ Create new category
  - ✅ Edit existing category
  - ✅ Delete category
  - ✅ Auto-generate slugs
  - ✅ Set category images
  - ✅ Add descriptions

- **Category Fields:**
  - Name (required)
  - Slug (auto-generated, editable)
  - Description (optional)
  - Image URL (optional)
  - Product count (auto-calculated)

## 🔒 Security Features

### Authentication
- **JWT-based authentication**
  - Tokens stored in HTTP-only cookies
  - 7-day expiration
  - Secure flag in production

### Role-Based Access Control (RBAC)
- **Roles (in order of permissions):**
  1. **Staff** - View only access
  2. **Manager** - Can manage orders
  3. **Admin** - Full product and category management
  4. **Super Admin** - Complete system access

### Password Security
- Passwords hashed using Node.js crypto (scrypt)
- Salt-based hashing for security
- Never stored in plain text

## 🔧 API Endpoints

### Authentication
```
POST /api/admin/auth/login          - Admin login
POST /api/admin/auth/logout         - Admin logout
POST /api/admin/seed-admin          - Create default admin (first-time setup)
```

### Dashboard
```
GET  /api/admin/dashboard/stats     - Get dashboard statistics
```

### Products
```
GET    /api/admin/products          - List all products (paginated)
GET    /api/admin/products/:id      - Get single product
POST   /api/admin/products          - Create new product (Admin+ only)
PUT    /api/admin/products/:id      - Update product (Admin+ only)
DELETE /api/admin/products/:id      - Delete product (Admin+ only)
```

### Categories
```
GET    /api/admin/categories        - List all categories
POST   /api/admin/categories        - Create category (Admin+ only)
PUT    /api/admin/categories/:id    - Update category (Admin+ only)
DELETE /api/admin/categories/:id    - Delete category (Admin+ only)
```

### Orders
```
GET  /api/admin/orders              - List all orders (paginated)
GET  /api/admin/orders?status=X     - Filter orders by status
GET  /api/admin/orders/:id          - Get single order
POST /api/admin/orders/:id/status   - Update order status
```

## 📱 User Interface

### Design System
- **Color Scheme:**
  - Primary: Burhan brand colors maintained
  - Sidebar: Dark slate (#0F172A)
  - Accent: Blue (#2563EB)
  - Success: Green
  - Warning: Yellow
  - Error: Red

- **Components:**
  - Responsive sidebar navigation
  - Collapsible sidebar for more space
  - Data tables with hover effects
  - Modal dialogs for forms
  - Toast notifications for actions
  - Color-coded status badges
  - Loading states

### Responsive Design
- **Mobile:** Sidebar collapses to icons only
- **Tablet:** Full sidebar visible
- **Desktop:** Optimal layout with full sidebar

## 🚀 Quick Start Guide

### First Time Setup

1. **Access Admin Panel:**
   ```
   Navigate to: /admin/login
   ```

2. **Login with Default Credentials:**
   ```
   Email: admin@burhan.com
   Password: Admin@123
   ```

3. **Verify Dashboard Access:**
   - You should see the dashboard with statistics
   - All menu items should be accessible

### Daily Operations

#### Processing Orders
1. Go to **Orders** (`/admin/orders`)
2. Filter by **Pending** status
3. Review order details
4. Update status as you process:
   - Confirm → Processing → Packed → Shipped → Delivered

#### Managing Products
1. Go to **Products** (`/admin/products`)
2. Monitor stock levels (red badges = restock needed)
3. Edit products to update prices, stock, or details
4. Mark products as Featured/Trending for homepage visibility

#### Organizing Categories
1. Go to **Categories** (`/admin/categories`)
2. Create categories for new product types
3. Add descriptions and images for better organization
4. Product counts update automatically

## 🔄 Workflow Examples

### New Order Workflow
1. Customer places order on website
2. Order appears in Admin → Orders with **Pending** status
3. Admin confirms order → Change to **Confirmed**
4. Prepare products → Change to **Processing**
5. Pack order → Change to **Packed**
6. Hand to courier → Change to **Shipped**
7. Customer receives → Change to **Delivered**

### Adding New Product
1. Go to **Products** → Click **Add Product**
2. Fill in all product details
3. Upload images
4. Set pricing and stock
5. Mark as Featured/Trending if needed
6. Save → Product appears on storefront

### Handling Cancellations
1. Find order in **Orders**
2. Change status to **Cancelled**
3. Update notes with reason
4. Process refund if payment was received
5. Update status to **Refunded**

## 📈 Analytics & Reporting

### Available Metrics
- Daily revenue tracking
- Total revenue (all-time)
- Order status breakdown
- Inventory levels
- Low stock alerts
- Best-selling products (by review count)

### Monitoring Tips
- Check dashboard daily for overview
- Monitor **Pending Orders** count
- Watch for **Low Stock** alerts
- Track revenue trends

## 🛠️ Technical Details

### Database Collections
```
- admins (Admin users with roles)
- products (Product catalog)
- categories (Product categories)
- orders (Customer orders)
- reviews (Product reviews - existing)
```

### Admin User Schema
```javascript
{
  _id: UUID,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['staff', 'manager', 'admin', 'superadmin'],
  createdAt: Date
}
```

## 🔐 Security Best Practices

1. **Change Default Password:**
   - Never use default credentials in production
   - Use strong passwords (12+ characters)

2. **Access Control:**
   - Only give admin access to trusted staff
   - Use appropriate roles for different team members

3. **Regular Monitoring:**
   - Review admin actions regularly
   - Check for suspicious activities

4. **Session Management:**
   - Sessions expire after 7 days
   - Logout when not in use

## 🚨 Troubleshooting

### Cannot Login
- **Issue:** "Invalid credentials" error
- **Solution:** Verify credentials, ensure admin user exists
- **Run:** `POST /api/admin/seed-admin` to create default admin

### Dashboard Not Loading
- **Issue:** Stats not displaying
- **Solution:** Check database connection, verify API endpoints

### Permission Denied
- **Issue:** "Insufficient permissions" error
- **Solution:** Check user role, ensure proper permissions

### Session Expired
- **Issue:** Redirected to login unexpectedly
- **Solution:** Login again, sessions expire after 7 days

## 📞 Support

For admin panel issues or questions:
- **Email:** infoburhancommunication@gmail.com
- **Phone:** 03013301830
- **WhatsApp:** 03150693148

## 🔄 Future Enhancements

Planned features (architecture ready):
- [ ] Bulk product upload (CSV/Excel)
- [ ] Advanced analytics and reports
- [ ] Customer management with notes
- [ ] Review moderation
- [ ] Email notifications for orders
- [ ] SMS notifications via SMS APIs
- [ ] Invoice generation (PDF)
- [ ] Inventory management with automatic reorder
- [ ] Settings panel for site configuration
- [ ] Admin activity logs
- [ ] Two-Factor Authentication (2FA)

---

**Admin Panel Version:** 1.0.0  
**Last Updated:** June 2025  
**Status:** Production Ready ✅
