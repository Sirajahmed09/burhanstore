'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Plus,
  Edit,
  Trash2,
  Folder,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: ''
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name)
    }));
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setSubmitting(true);
    const url = editingCategory
      ? `/api/admin/categories/${editingCategory._id}`
      : '/api/admin/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name)
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save category');
      }

      await fetchCategories();
      setShowModal(false);
      showToast(editingCategory ? 'Category updated successfully' : 'Category created successfully');
    } catch (error) {
      showToast(error.message || 'Failed to save category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${deleteTarget._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(prev => prev.filter(c => c._id !== deleteTarget._id));
      showToast(`Category "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (error) {
      showToast(error.message || 'Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center space-x-2 text-white ${
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-burhan-primary">
              Category Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage electronic catalog categories. Each category automatically syncs with product forms.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-burhan-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <RefreshCw className="w-8 h-8 text-burhan-secondary animate-spin mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading store categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-burhan-primary mb-1">No categories yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first electronics category (e.g. Wireless Earbuds, Fast Chargers).
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-5 py-2.5 bg-burhan-primary text-white rounded-xl text-sm font-semibold hover:bg-burhan-secondary"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Category
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div
                key={category._id}
                className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-burhan-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Folder className="w-7 h-7 text-burhan-secondary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-burhan-primary text-base truncate">
                          {category.name}
                        </h3>
                        <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {category.productCount || 0} product{(category.productCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(category)}
                        title="Edit category"
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        title="Delete category"
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {category.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 text-[11px] font-mono text-gray-400">
                  Slug: /{category.slug}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-heading font-bold text-lg text-burhan-primary">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Smart Watches & Bands"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Slug (URL identifier)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="smart-watches"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of products in this category..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-burhan-primary text-white font-semibold text-sm hover:bg-burhan-secondary transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="font-heading font-bold text-xl text-gray-900 mb-1">
                  Delete Category?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete category <strong>"{deleteTarget.name}"</strong>?
                </p>
                <p className="text-xs text-red-500 mt-2">
                  This will not delete existing products, but will detach this category.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
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
