'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  X,
  AlertTriangle
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in', 'low', 'out'

  // Quick Price Edit Modal State
  const [priceModalProduct, setPriceModalProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [newOldPrice, setNewOldPrice] = useState('');
  const [priceSaving, setPriceSaving] = useState(false);

  // Quick Stock Edit Modal State
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [stockSaving, setStockSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products?limit=200&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data?.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/categories?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data?.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Quick Toggle Status (Active <-> Inactive)
  const handleToggleStatus = async (product) => {
    const currentStatus = product.status || (product.isActive === false ? 'inactive' : 'active');
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    // Optimistic UI update
    setProducts(prev =>
      prev.map(p =>
        p._id === product._id
          ? { ...p, status: nextStatus, isActive: nextStatus === 'active' }
          : p
      )
    );

    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, isActive: nextStatus === 'active' })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      if (data.product) {
        setProducts(prev =>
          prev.map(p => (p._id === product._id ? data.product : p))
        );
      }

      showToast(`Product is now ${nextStatus === 'active' ? 'Visible (Active)' : 'Hidden (Inactive)'}`);
    } catch (err) {
      // Revert on failure
      setProducts(prev =>
        prev.map(p =>
          p._id === product._id
            ? { ...p, status: currentStatus, isActive: currentStatus === 'active' }
            : p
        )
      );
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  // Quick Save Price
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!priceModalProduct) return;

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    setPriceSaving(true);
    try {
      const parsedOld = newOldPrice ? parseFloat(newOldPrice) : null;
      const res = await fetch(`/api/admin/products/${priceModalProduct._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parsedPrice,
          oldPrice: parsedOld
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update price');

      if (data.product) {
        setProducts(prev =>
          prev.map(p => (p._id === priceModalProduct._id ? data.product : p))
        );
      } else {
        setProducts(prev =>
          prev.map(p =>
            p._id === priceModalProduct._id
              ? { ...p, price: parsedPrice, oldPrice: parsedOld }
              : p
          )
        );
      }

      showToast(`Price updated to PKR ${parsedPrice.toLocaleString()}`);
      setPriceModalProduct(null);
    } catch (err) {
      showToast(err.message || 'Failed to update price', 'error');
    } finally {
      setPriceSaving(false);
    }
  };

  // Quick Save Stock
  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    const parsedStock = parseInt(newStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      showToast('Please enter a valid non-negative stock quantity', 'error');
      return;
    }

    setStockSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${stockModalProduct._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: parsedStock })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');

      if (data.product) {
        setProducts(prev =>
          prev.map(p => (p._id === stockModalProduct._id ? data.product : p))
        );
      } else {
        setProducts(prev =>
          prev.map(p =>
            p._id === stockModalProduct._id
              ? { ...p, stock: parsedStock }
              : p
          )
        );
      }

      showToast(
        parsedStock === 0
          ? 'Stock updated to 0 (Item is now Out of Stock)'
          : `Stock updated to ${parsedStock} units`
      );
      setStockModalProduct(null);
    } catch (err) {
      showToast(err.message || 'Failed to update stock', 'error');
    } finally {
      setStockSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteProductTarget._id}`, {
        method: 'DELETE'
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      setProducts(prev => prev.filter(p => p._id !== deleteProductTarget._id));
      showToast(`"${deleteProductTarget.name}" deleted successfully.`);
      setDeleteProductTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    const stock = Number(product.stock) || 0;
    let matchesStock = true;
    if (stockFilter === 'out') {
      matchesStock = stock <= 0;
    } else if (stockFilter === 'low') {
      matchesStock = stock > 0 && stock < 10;
    } else if (stockFilter === 'in') {
      matchesStock = stock >= 10;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <AdminLayout>
      <div className="pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center space-x-2 text-white transition-all transform animate-in fade-in slide-in-from-top-4 ${
              toastMessage.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-semibold">{toastMessage.message}</span>
          </div>
        )}

        {/* Header with Title & Add Product CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-burhan-primary">
              Product Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your store catalog: update prices, stock, images, and visibility in real-time.
            </p>
          </div>

          <Link
            href="/admin/products/create"
            className="inline-flex items-center justify-center space-x-2 bg-burhan-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Product</span>
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-sm text-gray-900"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-56">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-sm text-gray-900"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 mr-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Inventory Filter:
            </span>
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stockFilter === 'all'
                  ? 'bg-burhan-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('in')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stockFilter === 'in'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Stock ({products.filter(p => (Number(p.stock) || 0) >= 10).length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock &lt;10 ({products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) < 10).length})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stockFilter === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Out of Stock ({products.filter(p => (Number(p.stock) || 0) <= 0).length})
            </button>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <RefreshCw className="w-8 h-8 text-burhan-secondary animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-burhan-primary mb-1">No products found</h3>
            <p className="text-sm text-gray-500 mb-6">
              Try modifying your search query, adjusting your category, or add a new product.
            </p>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center px-5 py-2.5 bg-burhan-primary text-white rounded-xl text-sm font-semibold hover:bg-burhan-secondary"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Product & SKU</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Price (PKR)</th>
                    <th className="px-6 py-3.5">Stock Level</th>
                    <th className="px-6 py-3.5">Store Visibility</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map(product => {
                    const stock = Number(product.stock) || 0;
                    const isOutOfStock = stock <= 0;
                    const isLowStock = stock > 0 && stock < 10;
                    const isActive =
                      product.status === 'active' ||
                      (product.status !== 'inactive' && product.isActive !== false);

                    const coverImg =
                      product.thumbnail ||
                      product.images?.[0] ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';

                    return (
                      <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Product info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={coverImg}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate max-w-xs md:max-w-sm">
                                {product.name}
                              </p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-xs font-mono text-gray-500">
                                  {product.sku || 'NO-SKU'}
                                </span>
                                {product.isFeatured && (
                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                    Featured
                                  </span>
                                )}
                                {product.isTrending && (
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                    Trending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                            {product.category || 'General'}
                          </span>
                        </td>

                        {/* Price & Quick Price Edit */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="font-bold text-gray-900">
                                PKR {Number(product.price || 0).toLocaleString()}
                              </div>
                              {product.oldPrice && (
                                <div className="text-xs text-gray-400 line-through">
                                  PKR {Number(product.oldPrice).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <button
                              title="Quick edit price"
                              onClick={() => {
                                setPriceModalProduct(product);
                                setNewPrice(product.price);
                                setNewOldPrice(product.oldPrice || '');
                              }}
                              className="p-1 text-gray-400 hover:text-burhan-secondary hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Stock & Quick Stock Edit */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Out of Stock (0)'
                                : `${stock} in stock`}
                            </span>
                            <button
                              title="Quick edit stock"
                              onClick={() => {
                                setStockModalProduct(product);
                                setNewStock(stock);
                              }}
                              className="p-1 text-gray-400 hover:text-burhan-secondary hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Status Toggle (Show / Hide) */}
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                            title={isActive ? 'Click to hide product' : 'Click to show product'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="block text-[11px] font-medium text-gray-500 mt-0.5">
                            {isActive ? 'Active (Live)' : 'Hidden'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Link
                              href={`/shop/${product.slug}`}
                              target="_blank"
                              title="View on store"
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <Link
                              href={`/admin/products/edit/${product._id}`}
                              title="Edit full product details"
                              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => setDeleteProductTarget(product)}
                              title="Delete product permanently"
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
              <span>All updates sync automatically with online store</span>
            </div>
          </div>
        )}

        {/* Quick Price Edit Modal */}
        {priceModalProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-lg text-burhan-primary">
                  Quick Price Change
                </h3>
                <button
                  onClick={() => setPriceModalProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                Updating price for: <strong className="text-gray-900">{priceModalProduct.name}</strong>
              </p>

              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Selling Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Original Price (Optional, for strikethrough)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newOldPrice}
                    onChange={e => setNewOldPrice(e.target.value)}
                    placeholder="Leave empty if no discount"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setPriceModalProduct(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={priceSaving}
                    className="px-5 py-2 rounded-xl bg-burhan-primary text-white font-semibold text-sm hover:bg-burhan-secondary transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {priceSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Price</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Stock Edit Modal */}
        {stockModalProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-lg text-burhan-primary">
                  Quick Stock Management
                </h3>
                <button
                  onClick={() => setStockModalProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                Updating stock quantity for: <strong className="text-gray-900">{stockModalProduct.name}</strong>
              </p>

              <form onSubmit={handleSaveStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Available Quantity in Inventory <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setNewStock(Math.max(0, parseInt(newStock || 0, 10) - 1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={e => setNewStock(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewStock(parseInt(newStock || 0, 10) + 1)}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {parseInt(newStock, 10) === 0
                      ? '⚠️ Setting stock to 0 will automatically display "Out of Stock" on the store website.'
                      : parseInt(newStock, 10) < 10
                      ? '⚠️ Stock below 10 will trigger a low-stock alert.'
                      : '✅ In stock and ready to purchase.'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={stockSaving}
                    className="px-5 py-2 rounded-xl bg-burhan-primary text-white font-semibold text-sm hover:bg-burhan-secondary transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {stockSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Stock</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteProductTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-1">
                  Delete Product?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to permanently delete:
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  "{deleteProductTarget.name}"
                </p>
                <p className="text-xs text-red-500 mt-2">
                  This action cannot be undone. The product will be completely removed from the catalog.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeleteProductTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
