'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Search, Eye, Filter, RefreshCw, MessageCircle, Clock, CheckCircle, Package, Truck, AlertCircle } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter 
        ? `/api/admin/orders?status=${statusFilter}`
        : '/api/admin/orders';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border border-purple-200',
      packed: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      shipped: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      returned: 'bg-orange-100 text-orange-800 border border-orange-200',
      refunded: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCleanWhatsAppNumber = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.startsWith('03')) return '92' + digits.slice(1);
    if (digits.startsWith('92')) return digits;
    return digits;
  };

  const filteredOrders = orders.filter(order => {
    const sTerm = searchTerm.toLowerCase().trim();
    if (!sTerm) return true;
    const orderId = String(order._id || '').toLowerCase();
    const custName = String(order.customer?.name || '').toLowerCase();
    const custPhone = String(order.customer?.phone || '');
    const custCity = String(order.customer?.city || '').toLowerCase();
    return orderId.includes(sTerm) || custName.includes(sTerm) || custPhone.includes(sTerm) || custCity.includes(sTerm);
  });

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => ['delivered', 'shipped', 'confirmed', 'pending'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <AdminLayout>
      <div>
        {/* Header with quick metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-burhan-primary mb-1">
              Orders Management
            </h1>
            <p className="text-gray-600 text-sm">Real-time live customer orders received from the website</p>
          </div>

          <button
            onClick={fetchOrders}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-burhan-secondary' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Quick Order Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrdersCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <p className="text-xs text-amber-600 font-semibold uppercase">Pending Orders</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{pendingOrdersCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Delivered</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{deliveredOrdersCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <p className="text-xs text-blue-600 font-semibold uppercase">Active Revenue</p>
            <p className="text-xl font-bold text-blue-700 mt-1">PKR {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary bg-white"
            >
              <option value="">All Orders ({orders.length})</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <RefreshCw className="w-8 h-8 text-burhan-secondary animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading orders from database...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const cleanPhone = getCleanWhatsAppNumber(order.customer?.phone);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="font-mono text-sm font-bold text-burhan-secondary hover:underline"
                          >
                            #{String(order._id || '').slice(0, 12).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {order.customer?.name || 'Customer'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2 mt-0.5">
                            <span>{order.customer?.phone || 'No phone'}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Contact on WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {order.customer?.city && (
                            <span className="text-[11px] text-gray-400">
                              {order.customer.city}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-burhan-primary">
                            PKR {Number(order.total || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.items?.length || 0} item(s)
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${getStatusColor(order.status)} cursor-pointer focus:outline-none`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700">No orders found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || statusFilter 
                    ? 'Try clearing your search filters to see all orders.' 
                    : 'Customer orders placed on the website will show up here automatically.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

