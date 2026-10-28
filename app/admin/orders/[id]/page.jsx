'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OrderInvoice from '@/components/admin/OrderInvoice';
import { invoicePrintIssue } from '@/lib/orders/invoice';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Printer, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  MessageCircle,
  RefreshCw
} from 'lucide-react';

export default function OrderDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;

  const [order, setOrder] = useState(null);
  const [invoiceSender, setInvoiceSender] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updateToast, setUpdateToast] = useState(null);
  const [shipmentForm, setShipmentForm] = useState({ courier: '', trackingNumber: '', trackingUrl: '' });
  const [shipmentSaving, setShipmentSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setInvoiceSender(data.invoiceSender || null);
        setNewStatus(data.order?.status || 'pending');
        setShipmentForm({
          courier: data.order?.shipment?.courier || '',
          trackingNumber: data.order?.shipment?.trackingNumber || '',
          trackingUrl: data.order?.shipment?.trackingUrl || '',
        });
      } else {
        setOrder(null);
        setInvoiceSender(null);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    const issue = invoicePrintIssue(order, invoiceSender);
    if (issue) { setUpdateToast({ type: 'error', message: issue }); return; }
    setPrinting(true);
    const originalTitle = document.title;
    try {
      await document.fonts?.ready;
      const logo = document.querySelector('#burhan-order-invoice img');
      if (!logo) throw new Error('Invoice is still loading. Please try again.');
      await logo.decode();
      document.title = `BURHAN-Invoice-${String(order.orderNumber || order._id).replace(/[^a-zA-Z0-9-]/g, '')}`;
      window.print();
    } catch {
      setUpdateToast({ type: 'error', message: 'Invoice or logo could not load. Please refresh and try again.' });
    } finally {
      document.title = originalTitle;
      setPrinting(false);
    }
  };

  const handleShipmentSave = async (e) => {
    e.preventDefault();
    setShipmentSaving(true);
    setUpdateToast(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(shipmentForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save shipment details');
      setOrder(data.order);
      setUpdateToast({ type: 'success', message: 'Shipment details saved. You can now mark the order as shipped.' });
    } catch (error) {
      setUpdateToast({ type: 'error', message: error.message || 'Failed to save shipment details' });
    } finally {
      setShipmentSaving(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!orderId || !newStatus) return;

    setUpdateToast(null);
    try {
      setUpdating(true);
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          status: newStatus,
          message: statusMessage.trim() || `Status changed to ${newStatus}`
        })
      });

      if (res.ok) {
        setStatusMessage('');
        await fetchOrderDetails();
        setUpdateToast({ type: 'success', message: 'Order status successfully updated!' });
        setTimeout(() => setUpdateToast(null), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        setUpdateToast({ type: 'error', message: err.error || 'Failed to update status' });
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setUpdateToast({ type: 'error', message: 'Error updating order status' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      packed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
      returned: 'bg-orange-100 text-orange-800 border-orange-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCleanWhatsAppNumber = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/[^0-9]/g, '');
    if (digits.startsWith('03')) {
      return '92' + digits.slice(1);
    }
    if (digits.startsWith('92')) {
      return digits;
    }
    return digits;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-burhan-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="py-12 max-w-lg mx-auto text-center bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">The requested order ID does not exist or has been deleted.</p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-burhan-primary text-white rounded-xl font-medium hover:bg-opacity-90"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const cleanWaNumber = getCleanWhatsAppNumber(order.customer?.phone);
  const waMessage = encodeURIComponent(`Assalam o Alaikum ${order.customer?.name || 'Customer'}, thank you for shopping at Burhan Store. Regarding your order #${order._id.slice(0, 8).toUpperCase()} for PKR ${Number(order.total || 0).toLocaleString()}...`);

  return (
    <AdminLayout>
      <OrderInvoice order={order} sender={invoiceSender} />
      <div className="pb-12 max-w-6xl mx-auto">
        {invoicePrintIssue(order, invoiceSender) && <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{invoicePrintIssue(order, invoiceSender)} <Link href="/admin/settings#parcel-sender" className="font-bold underline">Parcel sender settings</Link></div>}
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-burhan-primary transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders List</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintInvoice}
              disabled={printing}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? 'Preparing...' : 'Print Invoice'}</span>
            </button>
            <button
              onClick={fetchOrderDetails}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {updateToast && (
          <div className={`p-4 mb-6 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            updateToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span>{updateToast.message}</span>
            <button onClick={() => setUpdateToast(null)} className="text-xs ml-3 font-bold">✕</button>
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 font-heading">
                  Order #{order._id.slice(0, 12).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </p>
            </div>

            {/* Quick Status Update Form */}
            <form onSubmit={handleStatusChange} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
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

              <button
                type="submit"
                disabled={updating || newStatus === order.status}
                className="px-4 py-2 bg-burhan-secondary text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-xl font-bold text-burhan-primary">PKR {Number(order.total || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-sm font-semibold text-gray-800">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Total Items</p>
              <p className="text-sm font-semibold text-gray-800">{order.items?.length || 0} product(s)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Customer City</p>
              <p className="text-sm font-semibold text-gray-800">{order.customer?.city || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ordered Items and Financials */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Table Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-heading font-bold text-gray-900 text-lg flex items-center space-x-2">
                  <Package className="w-5 h-5 text-burhan-secondary" />
                  <span>Ordered Items</span>
                </h2>
                <span className="text-xs text-gray-500 font-medium">{order.items?.length || 0} item(s)</span>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 relative overflow-hidden flex-shrink-0 border border-gray-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name || 'Product'}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        PKR {Number(item.price || 0).toLocaleString()} × {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">
                        PKR {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Cost Breakdown */}
              <div className="bg-gray-50 p-5 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">PKR {Number(order.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Charges (Shipping):</span>
                  <span className="font-medium text-gray-900">PKR {Number(order.shipping || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-burhan-primary pt-2 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span>PKR {Number(order.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Timeline / History Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-burhan-secondary" />
                <span>Order Timeline & Activity</span>
              </h2>

              <div className="space-y-4">
                {(order.timeline && order.timeline.length > 0) ? (
                  order.timeline.map((entry, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-sm">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-burhan-secondary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 capitalize">{entry.status || 'Update'}</p>
                        <p className="text-gray-600 text-xs">{entry.message || 'Status updated'}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Order placed on {new Date(order.createdAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Delivery Details */}
          <div className="space-y-6">
            {/* Manual Courier Shipment Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900 text-lg mb-2 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-burhan-secondary" />
                <span>Manual Courier Shipment</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">Book the parcel with the courier first, then save the official tracking details here.</p>
              <form onSubmit={handleShipmentSave} className="space-y-3">
                <input
                  required
                  value={shipmentForm.courier}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, courier: e.target.value })}
                  placeholder="Courier name (e.g. TCS, Leopards)"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <input
                  required
                  value={shipmentForm.trackingNumber}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })}
                  placeholder="AWB / tracking number"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <input
                  required
                  type="url"
                  value={shipmentForm.trackingUrl}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, trackingUrl: e.target.value })}
                  placeholder="https://courier.example/track/..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <button
                  type="submit"
                  disabled={shipmentSaving || ['delivered', 'cancelled', 'returned', 'refunded'].includes(order.status)}
                  className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {shipmentSaving ? 'Saving...' : 'Save Shipment Details'}
                </button>
              </form>
              {order.shipment?.courier && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  <div><strong>Courier:</strong> {order.shipment.courier}</div>
                  <div><strong>Tracking:</strong> {order.shipment.trackingNumber}</div>
                  <a className="text-burhan-secondary hover:underline" href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Open tracking link</a>
                </div>
              )}
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-burhan-secondary" />
                <span>Customer Details</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Full Name</p>
                  <p className="text-base font-bold text-gray-900">{order.customer?.name || 'Customer'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Primary Phone</p>
                  <div className="flex items-center justify-between mt-1">
                    <a
                      href={`tel:${order.customer?.phone}`}
                      className="text-burhan-secondary font-mono font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.customer?.phone}</span>
                    </a>

                    {cleanWaNumber && (
                      <a
                        href={`https://wa.me/${cleanWaNumber}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {order.customer?.alternatePhone && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Alternate Phone</p>
                    <a
                      href={`tel:${order.customer?.alternatePhone}`}
                      className="text-gray-700 font-mono font-medium hover:underline flex items-center space-x-1 mt-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{order.customer?.alternatePhone}</span>
                    </a>
                  </div>
                )}

                {order.customer?.email && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Email Address</p>
                    <p className="text-sm text-gray-700 mt-1">{order.customer?.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping / Delivery Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900 text-lg mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-burhan-secondary" />
                <span>Shipping Address</span>
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Street / House Address</p>
                  <p className="text-gray-800 font-medium mt-1 leading-relaxed">
                    {order.customer?.address || 'No address provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">City</p>
                    <p className="text-gray-800 font-semibold mt-0.5">{order.customer?.city || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Province</p>
                    <p className="text-gray-800 font-semibold mt-0.5">{order.customer?.province || 'N/A'}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Delivery Instructions / Notes</p>
                    <p className="text-gray-700 italic mt-1 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                      &quot;{order.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
