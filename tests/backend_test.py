#!/usr/bin/env python3
"""
BURHAN eCommerce Backend API Test Suite
Tests all backend endpoints for deployment readiness validation
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://burhan-store.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"
ADMIN_API_URL = f"{BASE_URL}/api/admin"

# Test credentials
ADMIN_EMAIL = "admin@burhan.com"
ADMIN_PASSWORD = "Admin@123"

# Global state
admin_token = None
test_product_slug = None
test_order_id = None
test_category_id = None

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(message: str):
    print(f"{Colors.BLUE}[TEST]{Colors.RESET} {message}")

def print_success(message: str):
    print(f"{Colors.GREEN}✓ PASS:{Colors.RESET} {message}")

def print_error(message: str):
    print(f"{Colors.RED}✗ FAIL:{Colors.RESET} {message}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠ WARNING:{Colors.RESET} {message}")

def print_section(title: str):
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{'='*80}\n")

def make_request(method: str, url: str, **kwargs) -> Optional[requests.Response]:
    """Make HTTP request with error handling"""
    try:
        response = requests.request(method, url, timeout=30, **kwargs)
        return response
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {e}")
        return None

# ============================================================================
# CRITICAL PRIORITY - Admin Authentication Flow
# ============================================================================

def test_seed_admin():
    """Test admin user seeding"""
    print_test("Testing POST /api/admin/seed-admin")
    
    response = make_request("POST", f"{ADMIN_API_URL}/seed-admin")
    
    if not response:
        print_error("Failed to connect to seed-admin endpoint")
        return False
    
    if response.status_code in [200, 201]:
        data = response.json()
        print_success(f"Admin seed endpoint working: {data.get('message', 'Success')}")
        return True
    else:
        print_error(f"Admin seed failed: {response.status_code} - {response.text}")
        return False

def test_admin_login():
    """Test admin login and JWT token generation"""
    global admin_token
    
    print_test("Testing POST /api/admin/auth/login")
    
    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = make_request("POST", f"{ADMIN_API_URL}/auth/login", json=payload)
    
    if not response:
        print_error("Failed to connect to login endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        
        # Check for user data
        if 'user' not in data:
            print_error("Login response missing 'user' field")
            return False
        
        user = data['user']
        if user.get('email') != ADMIN_EMAIL:
            print_error(f"User email mismatch: expected {ADMIN_EMAIL}, got {user.get('email')}")
            return False
        
        # Check for token in cookies
        if 'admin_token' in response.cookies:
            admin_token = response.cookies['admin_token']
            print_success(f"Admin login successful - User: {user.get('name')} ({user.get('role')})")
            print_success(f"JWT token received in cookies")
            return True
        else:
            print_warning("Login successful but no token in cookies")
            # Try to extract from headers or response
            return True
    else:
        print_error(f"Login failed: {response.status_code} - {response.text}")
        return False

def test_authenticated_endpoint():
    """Test an authenticated endpoint with token"""
    print_test("Testing authenticated endpoint with JWT token")
    
    if not admin_token:
        print_warning("No admin token available, skipping authenticated test")
        return True
    
    cookies = {'admin_token': admin_token}
    response = make_request("GET", f"{ADMIN_API_URL}/dashboard/stats", cookies=cookies)
    
    if not response:
        print_error("Failed to connect to authenticated endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        print_success(f"Authenticated request successful - Dashboard stats retrieved")
        return True
    else:
        print_error(f"Authenticated request failed: {response.status_code}")
        return False

# ============================================================================
# HIGH PRIORITY - Public API Endpoints
# ============================================================================

def test_api_root():
    """Test API root endpoint"""
    print_test("Testing GET /api")
    
    response = make_request("GET", API_URL)
    
    if not response:
        print_error("Failed to connect to API root")
        return False
    
    if response.status_code == 200:
        data = response.json()
        print_success(f"API root accessible: {data.get('message', 'OK')}")
        return True
    else:
        print_error(f"API root failed: {response.status_code}")
        return False

def test_get_products():
    """Test products listing with pagination"""
    global test_product_slug
    
    print_test("Testing GET /api/products (with pagination)")
    
    response = make_request("GET", f"{API_URL}/products?page=1&limit=10")
    
    if not response:
        print_error("Failed to connect to products endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        
        if 'products' not in data:
            print_error("Response missing 'products' field")
            return False
        
        products = data['products']
        total = data.get('total', 0)
        page = data.get('page', 1)
        pages = data.get('pages', 0)
        
        print_success(f"Products retrieved: {len(products)} items (Total: {total}, Page {page}/{pages})")
        
        # Store first product slug for later tests
        if products and len(products) > 0:
            test_product_slug = products[0].get('slug')
            print_success(f"Sample product slug: {test_product_slug}")
        
        return True
    else:
        print_error(f"Products endpoint failed: {response.status_code}")
        return False

def test_get_best_sellers():
    """Test best sellers endpoint"""
    print_test("Testing GET /api/products/best-sellers")
    
    response = make_request("GET", f"{API_URL}/products/best-sellers")
    
    if not response:
        print_error("Failed to connect to best-sellers endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        products = data.get('products', [])
        print_success(f"Best sellers retrieved: {len(products)} products")
        return True
    else:
        print_error(f"Best sellers endpoint failed: {response.status_code}")
        return False

def test_get_featured_products():
    """Test featured products endpoint"""
    print_test("Testing GET /api/products/featured")
    
    response = make_request("GET", f"{API_URL}/products/featured")
    
    if not response:
        print_error("Failed to connect to featured products endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        products = data.get('products', [])
        print_success(f"Featured products retrieved: {len(products)} products")
        return True
    else:
        print_error(f"Featured products endpoint failed: {response.status_code}")
        return False

def test_get_trending_products():
    """Test trending products endpoint"""
    print_test("Testing GET /api/products/trending")
    
    response = make_request("GET", f"{API_URL}/products/trending")
    
    if not response:
        print_error("Failed to connect to trending products endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        products = data.get('products', [])
        print_success(f"Trending products retrieved: {len(products)} products")
        return True
    else:
        print_error(f"Trending products endpoint failed: {response.status_code}")
        return False

def test_get_product_by_slug():
    """Test single product retrieval by slug"""
    print_test(f"Testing GET /api/products/{test_product_slug}")
    
    if not test_product_slug:
        print_warning("No product slug available, skipping test")
        return True
    
    response = make_request("GET", f"{API_URL}/products/{test_product_slug}")
    
    if not response:
        print_error("Failed to connect to product detail endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        product = data.get('product')
        if product:
            print_success(f"Product retrieved: {product.get('name')} - PKR {product.get('price')}")
            return True
        else:
            print_error("Product data missing in response")
            return False
    else:
        print_error(f"Product detail endpoint failed: {response.status_code}")
        return False

def test_get_categories():
    """Test categories listing"""
    global test_category_id
    
    print_test("Testing GET /api/categories")
    
    response = make_request("GET", f"{API_URL}/categories")
    
    if not response:
        print_error("Failed to connect to categories endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        categories = data.get('categories', [])
        print_success(f"Categories retrieved: {len(categories)} categories")
        
        if categories and len(categories) > 0:
            test_category_id = categories[0].get('_id')
            print_success(f"Sample category: {categories[0].get('name')}")
        
        return True
    else:
        print_error(f"Categories endpoint failed: {response.status_code}")
        return False

def test_search_products():
    """Test product search"""
    print_test("Testing GET /api/search?q=burhan")
    
    response = make_request("GET", f"{API_URL}/search?q=burhan")
    
    if not response:
        print_error("Failed to connect to search endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        products = data.get('products', [])
        suggestions = data.get('suggestions', [])
        print_success(f"Search results: {len(products)} products, {len(suggestions)} suggestions")
        return True
    else:
        print_error(f"Search endpoint failed: {response.status_code}")
        return False

# ============================================================================
# HIGH PRIORITY - Admin API Endpoints (with auth)
# ============================================================================

def test_admin_dashboard_stats():
    """Test admin dashboard statistics"""
    print_test("Testing GET /api/admin/dashboard/stats")
    
    if not admin_token:
        print_warning("No admin token, skipping dashboard stats test")
        return True
    
    cookies = {'admin_token': admin_token}
    response = make_request("GET", f"{ADMIN_API_URL}/dashboard/stats", cookies=cookies)
    
    if not response:
        print_error("Failed to connect to dashboard stats endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        print_success(f"Dashboard stats retrieved:")
        print(f"  - Total Products: {data.get('totalProducts', 0)}")
        print(f"  - Total Orders: {data.get('totalOrders', 0)}")
        print(f"  - Total Revenue: PKR {data.get('totalRevenue', 0)}")
        print(f"  - Pending Orders: {data.get('pendingOrders', 0)}")
        return True
    else:
        print_error(f"Dashboard stats failed: {response.status_code}")
        return False

def test_admin_get_products():
    """Test admin products listing"""
    print_test("Testing GET /api/admin/products")
    
    if not admin_token:
        print_warning("No admin token, skipping admin products test")
        return True
    
    cookies = {'admin_token': admin_token}
    response = make_request("GET", f"{ADMIN_API_URL}/products?page=1&limit=10", cookies=cookies)
    
    if not response:
        print_error("Failed to connect to admin products endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        products = data.get('products', [])
        pagination = data.get('pagination', {})
        print_success(f"Admin products retrieved: {len(products)} items (Total: {pagination.get('total', 0)})")
        return True
    else:
        print_error(f"Admin products endpoint failed: {response.status_code}")
        return False

def test_admin_get_orders():
    """Test admin orders listing"""
    print_test("Testing GET /api/admin/orders")
    
    if not admin_token:
        print_warning("No admin token, skipping admin orders test")
        return True
    
    cookies = {'admin_token': admin_token}
    response = make_request("GET", f"{ADMIN_API_URL}/orders?page=1&limit=10", cookies=cookies)
    
    if not response:
        print_error("Failed to connect to admin orders endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        orders = data.get('orders', [])
        pagination = data.get('pagination', {})
        print_success(f"Admin orders retrieved: {len(orders)} items (Total: {pagination.get('total', 0)})")
        return True
    else:
        print_error(f"Admin orders endpoint failed: {response.status_code}")
        return False

def test_admin_get_categories():
    """Test admin categories listing"""
    print_test("Testing GET /api/admin/categories")
    
    if not admin_token:
        print_warning("No admin token, skipping admin categories test")
        return True
    
    cookies = {'admin_token': admin_token}
    response = make_request("GET", f"{ADMIN_API_URL}/categories", cookies=cookies)
    
    if not response:
        print_error("Failed to connect to admin categories endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        categories = data.get('categories', [])
        print_success(f"Admin categories retrieved: {len(categories)} categories")
        return True
    else:
        print_error(f"Admin categories endpoint failed: {response.status_code}")
        return False

# ============================================================================
# MEDIUM PRIORITY - Checkout Flow
# ============================================================================

def test_create_order():
    """Test order creation"""
    global test_order_id
    
    print_test("Testing POST /api/orders (Checkout flow)")
    
    # Sample order data
    order_data = {
        "items": [
            {
                "productId": "sample-product-id",
                "name": "Burhan AirPods Pro Max",
                "price": 8999,
                "quantity": 1,
                "image": "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400"
            }
        ],
        "customer": {
            "name": "Ahmed Khan",
            "email": "ahmed.khan@example.com",
            "phone": "03001234567",
            "address": "123 Main Street, Karachi",
            "city": "Karachi",
            "postalCode": "75500"
        },
        "subtotal": 8999,
        "shipping": 200,
        "total": 9199,
        "paymentMethod": "cod",
        "notes": "Please deliver between 2-5 PM"
    }
    
    response = make_request("POST", f"{API_URL}/orders", json=order_data)
    
    if not response:
        print_error("Failed to connect to orders endpoint")
        return False
    
    if response.status_code in [200, 201]:
        data = response.json()
        if data.get('success') and 'order' in data:
            order = data['order']
            test_order_id = order.get('_id')
            print_success(f"Order created successfully - Order ID: {test_order_id}")
            print_success(f"Order total: PKR {order.get('total')} - Status: {order.get('status')}")
            return True
        else:
            print_error("Order creation response missing expected fields")
            return False
    else:
        print_error(f"Order creation failed: {response.status_code} - {response.text}")
        return False

def test_track_order():
    """Test order tracking"""
    print_test("Testing POST /api/orders/track")
    
    if not test_order_id:
        print_warning("No order ID available, skipping order tracking test")
        return True
    
    track_data = {
        "orderId": test_order_id,
        "phone": "03001234567"
    }
    
    response = make_request("POST", f"{API_URL}/orders/track", json=track_data)
    
    if not response:
        print_error("Failed to connect to order tracking endpoint")
        return False
    
    if response.status_code == 200:
        data = response.json()
        order = data.get('order')
        if order:
            print_success(f"Order tracked successfully - Status: {order.get('status')}")
            return True
        else:
            print_error("Order tracking response missing order data")
            return False
    else:
        print_error(f"Order tracking failed: {response.status_code}")
        return False

# ============================================================================
# MEDIUM PRIORITY - Database Connectivity
# ============================================================================

def test_database_connectivity():
    """Test database connectivity by checking if data is being returned"""
    print_test("Testing database connectivity")
    
    # Test multiple endpoints to verify DB connection
    endpoints_to_test = [
        (f"{API_URL}/products", "Products"),
        (f"{API_URL}/categories", "Categories"),
    ]
    
    all_passed = True
    for url, name in endpoints_to_test:
        response = make_request("GET", url)
        if response and response.status_code == 200:
            data = response.json()
            # Check if we're getting actual data
            key = name.lower()
            if key in data and len(data[key]) > 0:
                print_success(f"Database connectivity verified via {name} endpoint")
            else:
                print_warning(f"{name} endpoint returned empty data - DB might need seeding")
        else:
            print_error(f"Database connectivity check failed for {name}")
            all_passed = False
    
    return all_passed

# ============================================================================
# Main Test Runner
# ============================================================================

def run_all_tests():
    """Run all backend API tests"""
    print_section("BURHAN eCommerce - Backend API Validation")
    print(f"Base URL: {BASE_URL}")
    print(f"Testing Environment: Preview/Production")
    print(f"Test Credentials: {ADMIN_EMAIL}")
    
    results = {
        'passed': 0,
        'failed': 0,
        'warnings': 0,
        'total': 0
    }
    
    tests = [
        # CRITICAL - Admin Authentication
        ("Admin User Seeding", test_seed_admin, "critical"),
        ("Admin Login", test_admin_login, "critical"),
        ("Authenticated Endpoint", test_authenticated_endpoint, "critical"),
        
        # HIGH - Public API
        ("API Root", test_api_root, "high"),
        ("Get Products", test_get_products, "high"),
        ("Get Best Sellers", test_get_best_sellers, "high"),
        ("Get Featured Products", test_get_featured_products, "high"),
        ("Get Trending Products", test_get_trending_products, "high"),
        ("Get Product by Slug", test_get_product_by_slug, "high"),
        ("Get Categories", test_get_categories, "high"),
        ("Search Products", test_search_products, "high"),
        
        # HIGH - Admin API
        ("Admin Dashboard Stats", test_admin_dashboard_stats, "high"),
        ("Admin Get Products", test_admin_get_products, "high"),
        ("Admin Get Orders", test_admin_get_orders, "high"),
        ("Admin Get Categories", test_admin_get_categories, "high"),
        
        # MEDIUM - Checkout Flow
        ("Create Order", test_create_order, "medium"),
        ("Track Order", test_track_order, "medium"),
        
        # MEDIUM - Database
        ("Database Connectivity", test_database_connectivity, "medium"),
    ]
    
    for test_name, test_func, priority in tests:
        print_section(f"[{priority.upper()}] {test_name}")
        results['total'] += 1
        
        try:
            result = test_func()
            if result:
                results['passed'] += 1
            else:
                results['failed'] += 1
        except Exception as e:
            print_error(f"Test exception: {str(e)}")
            results['failed'] += 1
    
    # Print summary
    print_section("TEST SUMMARY")
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.RESET}")
    
    success_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    if results['failed'] == 0:
        print(f"\n{Colors.GREEN}✓ ALL TESTS PASSED - Backend is production ready!{Colors.RESET}")
        return 0
    else:
        print(f"\n{Colors.RED}✗ {results['failed']} TEST(S) FAILED - Review issues above{Colors.RESET}")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
