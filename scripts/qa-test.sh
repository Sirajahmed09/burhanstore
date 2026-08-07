#!/bin/bash

# BURHAN STORE - Comprehensive Production QA Test Script
# Tests all critical functionality

echo "🔍 BURHAN STORE - PRODUCTION QA TEST"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo "✅ PASS ($response)"
        ((PASS++))
        return 0
    else
        echo "❌ FAIL ($response)"
        ((FAIL++))
        return 1
    fi
}

echo "📄 PUBLIC PAGES"
echo "---------------"
test_endpoint "Homepage" "$BASE_URL/"
test_endpoint "Shop Page" "$BASE_URL/shop"
test_endpoint "About Page" "$BASE_URL/about"
test_endpoint "Contact Page" "$BASE_URL/contact"
test_endpoint "Cart Page" "$BASE_URL/cart"
test_endpoint "Track Page" "$BASE_URL/track"
echo ""

echo "🔌 PUBLIC API ENDPOINTS"
echo "------------------------"
test_endpoint "Products API" "$BASE_URL/api/products"
test_endpoint "Categories API" "$BASE_URL/api/categories"
test_endpoint "Best Sellers API" "$BASE_URL/api/products/best-sellers"
echo ""

echo "🔐 ADMIN AUTHENTICATION"
echo "------------------------"
test_endpoint "Admin Login Page" "$BASE_URL/admin/login"
test_endpoint "Admin Login API" "$BASE_URL/api/admin/auth/login" "POST" '{"email":"admin@burhan.com","password":"Admin@123"}'
echo ""

echo "📊 ADMIN PAGES"
echo "---------------"
test_endpoint "Admin Dashboard" "$BASE_URL/admin/dashboard"
test_endpoint "Admin Products" "$BASE_URL/admin/products"
test_endpoint "Admin Orders" "$BASE_URL/admin/orders"
test_endpoint "Admin Categories" "$BASE_URL/admin/categories"
echo ""

echo "🖼️  IMAGE AVAILABILITY"
echo "------------------------"
# Test a few sample images
test_endpoint "Sample Product Image 1" "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400"
test_endpoint "Sample Product Image 2" "https://images.unsplash.com/photo-1609592043357-554eb9496153?w=400"
echo ""

echo "📦 DATABASE CONNECTIVITY"
echo "-------------------------"
# Test if products exist
product_count=$(curl -s "$BASE_URL/api/products" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('products', [])))" 2>/dev/null || echo "0")
if [ "$product_count" -gt "0" ]; then
    echo "✅ PASS - Database has $product_count products"
    ((PASS++))
else
    echo "❌ FAIL - No products in database"
    ((FAIL++))
fi
echo ""

echo "📊 TEST SUMMARY"
echo "==============="
echo "Total Tests: $((PASS + FAIL))"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    exit 0
else
    echo "⚠️  SOME TESTS FAILED"
    exit 1
fi
