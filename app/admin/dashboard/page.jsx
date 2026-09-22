'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  FolderOpen,
  Eye,
  Edit,
  RefreshCw,
  Boxes,
  CheckSquare,
  Users,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stats?.lowStockAlerts || [];
  const recentProducts = stats?.recentProducts || [];
  const recentOrders = stats?.recentOrders || [];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* Top Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-3xl font-bold text-burhan-primary">
                Store Dashboard
              </h1>
              {stats?.database && (
                stats.database.isConnected ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    MongoDB Atlas Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200" title="Connect MONGODB_URI in Vercel for multi-container database sync">
                    <span className="w-2 h-2 mr-1.5 bg-amber-500 rounded-full"></span>
                    Local Fallback Store
                  </span>
                )
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, Store Founder! Here is an overview of your electronics business performance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/products/create"
              className="inline-flex items-center space-x-2 bg-burhan-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center space-x-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-xs text-sm"
            >
              <Boxes className="w-4 h-4 text-burhan-secondary" />
              <span>Manage Stock</span>
            </Link>
          </div>
        </div>

        {/* Pending Approvals Alert Banner for Owner */}
        {stats?.pendingApprovalsCount > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-xs">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start space-x-3">
                <CheckSquare className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-bold text-base text-blue-950">
                    Pending Employee Change Requests ({stats.pendingApprovalsCount} Waiting)
                  </h3>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Staff members have submitted product price, stock, or catalog updates that require your authorization before taking effect.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/approvals"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
              >
                <span>Review Approvals Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Low Stock Warning Alert Banner (B.3) */}
        {lowStockItems.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
            <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-bold text-base text-amber-950">
                    Low-Stock &amp; Out-of-Stock Alert ({lowStockItems.length} Products Need Attention)
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Kuch products ka stock khatam hone wala hai ya 0 ho chuka hai. Customers ko out-of-stock na dikhe isliye inhe jald restock karein.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/products"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                <span>Restock Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Low stock preview pills */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-amber-200/70">
              {lowStockItems.slice(0, 5).map(item => (
                <div
                  key={item._id}
                  className="bg-white/80 border border-amber-200 px-3 py-1 rounded-lg text-xs flex items-center space-x-2"
                >
                  <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                    {item.name}
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      Number(item.stock) <= 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {Number(item.stock) <= 0 ? 'Out of stock' : `${item.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Core Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Products */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                Total Products
              </p>
              <h2 className="text-2xl font-extrabold text-burhan-primary mt-1">
                {loading ? '...' : stats?.totalProducts || 0}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Active in store catalog</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                Total Orders
              </p>
              <h2 className="text-2xl font-extrabold text-burhan-primary mt-1">
                {loading ? '...' : stats?.totalOrders || 0}
              </h2>
              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                <span className="text-amber-600 font-semibold">{stats?.pendingOrders || 0} pending</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{stats?.completedOrders || 0} done</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Revenue */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                Total Revenue
              </p>
              <h2 className="text-2xl font-extrabold text-burhan-primary mt-1">
                {loading ? '...' : `PKR ${(stats?.totalRevenue || 0).toLocaleString()}`}
              </h2>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Today: PKR {(stats?.todayRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Inventory Health */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                Low / Out of Stock
              </p>
              <h2 className="text-2xl font-extrabold text-amber-600 mt-1">
                {loading ? '...' : (stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.outOfStockCount || 0} out of stock
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/products"
            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-burhan-secondary/40 shadow-xs hover:shadow-md transition-all group flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-burhan-primary/5 text-burhan-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-burhan-secondary">
                Manage Products
              </h3>
              <p className="text-xs text-gray-500">Edit prices, stocks &amp; photos</p>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-burhan-secondary/40 shadow-xs hover:shadow-md transition-all group flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-700">
                Customer Orders
              </h3>
              <p className="text-xs text-gray-500">Process shipping &amp; status</p>
            </div>
          </Link>

          <Link
            href="/admin/approvals"
            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all group flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-amber-700">
                Approvals Queue
              </h3>
              <p className="text-xs text-gray-500">
                {stats?.pendingApprovalsCount ? `${stats.pendingApprovalsCount} pending request(s)` : 'Review staff changes'}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/employees"
            className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all group flex items-center space-x-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-purple-700">
                Team &amp; Roles
              </h3>
              <p className="text-xs text-gray-500">Add staff &amp; manage access</p>
            </div>
          </Link>
        </div>

        {/* Two Columns: Recent Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recently Added / Updated Products */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-heading text-lg font-bold text-burhan-primary">
                Recently Updated Products
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-burhan-secondary hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading products...</p>
              </div>
            ) : recentProducts.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No products added yet.</p>
            ) : (
              <div className="space-y-3">
                {recentProducts.map(product => {
                  const stock = Number(product.stock) || 0;
                  const coverImg =
                    product.thumbnail ||
                    product.images?.[0] ||
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';

                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100/60"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={coverImg}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.category} • PKR {Number(product.price || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            stock <= 0
                              ? 'bg-red-100 text-red-700'
                              : stock < 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stock <= 0 ? '0 left' : `${stock} in stock`}
                        </span>

                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="p-1.5 text-gray-400 hover:text-burhan-secondary hover:bg-gray-100 rounded-lg"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Orders List */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-heading text-lg font-bold text-burhan-primary">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-burhan-secondary hover:underline flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No orders received yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Customer orders placed on the store will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <div>
                      <p className="font-semibold text-sm text-gray-900 group-hover:text-burhan-secondary transition-colors">
                        {order.customer?.name || order.shippingAddress?.fullName || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Order #{String(order._id || '').slice(0, 8).toUpperCase()} • PKR {Number(order.total || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status || 'Pending'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-burhan-secondary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
