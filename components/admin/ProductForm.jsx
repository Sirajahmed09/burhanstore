'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  X,
  Plus,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function ProductForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    category: initialData?.category || '',
    price: initialData?.price !== undefined ? initialData.price : '',
    oldPrice: initialData?.oldPrice || '',
    stock: initialData?.stock !== undefined ? initialData.stock : 15,
    sku: initialData?.sku || '',
    description: initialData?.description || '',
    status: initialData?.status || (initialData?.isActive === false ? 'inactive' : 'active'),
    isFeatured: Boolean(initialData?.isFeatured),
    isTrending: Boolean(initialData?.isTrending),
    isNew: initialData?.isNew !== undefined ? Boolean(initialData.isNew) : true,
    images: Array.isArray(initialData?.images) && initialData.images.length > 0
      ? initialData.images
      : (initialData?.thumbnail ? [initialData.thumbnail] : []),
    coverIndex: 0
  });

  // Load categories
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        const list = data?.categories || [];
        setCategories(list);
        if (!formData.category && list.length > 0 && !isEdit) {
          setFormData(prev => ({ ...prev, category: list[0].name }));
        }
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Update formData if initialData changes
  useEffect(() => {
    if (initialData) {
      const imgs = Array.isArray(initialData.images) && initialData.images.length > 0
        ? initialData.images
        : (initialData.thumbnail ? [initialData.thumbnail] : []);
      
      let coverIdx = 0;
      if (initialData.thumbnail) {
        const found = imgs.indexOf(initialData.thumbnail);
        if (found !== -1) coverIdx = found;
      }

      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        category: initialData.category || '',
        price: initialData.price !== undefined ? initialData.price : '',
        oldPrice: initialData.oldPrice || '',
        stock: initialData.stock !== undefined ? initialData.stock : 15,
        sku: initialData.sku || '',
        description: initialData.description || '',
        status: initialData.status || (initialData.isActive === false ? 'inactive' : 'active'),
        isFeatured: Boolean(initialData.isFeatured),
        isTrending: Boolean(initialData.isTrending),
        isNew: initialData.isNew !== undefined ? Boolean(initialData.isNew) : true,
        images: imgs,
        coverIndex: coverIdx
      });
    }
  }, [initialData]);

  // Handle multiple file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadData = new FormData();
      files.forEach(file => uploadData.append('files', file));

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      if (data.urls && data.urls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...data.urls]
        }));
      }
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Add image URL manually
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  // Remove image
  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => {
      const updated = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newCover = prev.coverIndex;
      if (indexToRemove === prev.coverIndex) {
        newCover = 0;
      } else if (indexToRemove < prev.coverIndex) {
        newCover = Math.max(0, prev.coverIndex - 1);
      }
      return {
        ...prev,
        images: updated,
        coverIndex: newCover
      };
    });
  };

  // Set cover image
  const handleSetCover = (index) => {
    setFormData(prev => ({
      ...prev,
      coverIndex: index
    }));
  };

  // Auto-generate SKU
  const handleGenerateSKU = () => {
    const prefix = (formData.category ? formData.category.slice(0, 3).toUpperCase() : 'BUR');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${randomNum}` }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!formData.category) {
      setError('Please select a category.');
      return;
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (formData.images.length === 0) {
      setError('Please upload or add at least one product image.');
      return;
    }

    setLoading(true);

    try {
      const coverImage = formData.images[formData.coverIndex] || formData.images[0];
      // Re-order images so cover is first
      const orderedImages = [
        coverImage,
        ...formData.images.filter((_, idx) => idx !== formData.coverIndex)
      ];

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        stock: parseInt(formData.stock, 10) || 0,
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        images: orderedImages,
        thumbnail: coverImage,
        status: formData.status,
        isActive: formData.status === 'active',
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isNew: formData.isNew
      };

      const url = isEdit
        ? `/api/admin/products/${initialData._id}`
        : '/api/admin/products';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setSuccessMsg(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
      setLoading(false);
    }
  };

  // Calculate discount badge preview
  const priceNum = parseFloat(formData.price) || 0;
  const oldPriceNum = parseFloat(formData.oldPrice) || 0;
  const calculatedDiscount = oldPriceNum > priceNum && priceNum > 0
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-burhan-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Products
          </button>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-burhan-primary">
            {isEdit ? `Edit: ${formData.name || 'Product'}` : 'Add New Product'}
          </h1>
          <p className="text-sm text-gray-600">
            {isEdit
              ? 'Update product details, pricing, inventory, and images'
              : 'Add a new electronics or mobile accessory to your store catalog'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2.5 rounded-xl bg-burhan-primary text-white font-semibold hover:bg-burhan-secondary transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{isEdit ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-heading text-lg font-bold text-burhan-primary">
              General Information
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Burhan PowerCore 20000mAh Fast Charger"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe product specs, battery life, sound quality, warranty, and package contents..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    SKU / Product Code
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="text-xs text-burhan-secondary hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. BUR-EAR-101"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-heading text-lg font-bold text-burhan-primary">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Selling Price (PKR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2499"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Original / Old Price (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                    placeholder="3499 (optional)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Available Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="25"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {parseInt(formData.stock, 10) <= 0
                    ? '⚠️ Product will show as "Out of Stock" on website'
                    : parseInt(formData.stock, 10) < 10
                    ? '⚠️ Low stock alert will trigger'
                    : '✅ Healthy stock'}
                </p>
              </div>
            </div>

            {calculatedDiscount > 0 && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
                <span>Calculated Discount Badge:</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  -{calculatedDiscount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Product Media (Images) Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-burhan-primary">
                  Product Images
                </h2>
                <p className="text-xs text-gray-500">
                  Upload multiple photos. Click "Set as Cover" to pick the main thumbnail shown in catalog.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {formData.images.length} image{formData.images.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-gray-200 hover:border-burhan-secondary rounded-2xl p-6 text-center transition-colors bg-gray-50/50">
              <input
                type="file"
                id="product-image-upload"
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="product-image-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3 text-burhan-secondary">
                  {uploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-semibold text-burhan-primary mb-1">
                  {uploading ? 'Compressing & uploading webp...' : 'Click to upload or drag and drop images'}
                </p>
                <p className="text-xs text-gray-500">
                  Automatic optimization & WebP conversion enabled (PNG, JPG, WebP up to 10MB)
                </p>
              </label>
            </div>

            {/* Add by URL input */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                placeholder="Or paste an image URL (e.g. https://...)"
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary text-gray-900"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add URL
              </button>
            </div>

            {/* Images Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {formData.images.map((imgUrl, index) => {
                  const isCover = index === formData.coverIndex;
                  return (
                    <div
                      key={index}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square bg-gray-100 ${
                        isCover ? 'border-burhan-secondary ring-2 ring-burhan-secondary/20 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <span className="absolute top-2 left-2 bg-burhan-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                          COVER
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(index)}
                            className="text-xs bg-white text-gray-800 font-semibold px-2 py-1 rounded shadow hover:bg-gray-100"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-xs bg-red-600 text-white font-semibold px-2 py-1 rounded shadow hover:bg-red-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Status, Badges & Visibility */}
        <div className="space-y-6">
          {/* Status Card (Active / Inactive Toggle) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-heading text-lg font-bold text-burhan-primary">
              Product Status
            </h2>
            <p className="text-xs text-gray-500">
              Temporarily show or hide this product on the public store without deleting it.
            </p>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'active'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="product-status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-sm">Active (Visible)</span>
                    <span className="block text-xs text-gray-500 font-normal">
                      Customers can browse and buy
                    </span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'inactive'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-semibold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="product-status"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="block text-sm">Inactive (Hidden)</span>
                    <span className="block text-xs text-gray-500 font-normal">
                      Hidden from store search & shop
                    </span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </label>
            </div>
          </div>

          {/* Badges & Placement */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-heading text-lg font-bold text-burhan-primary">
              Badges & Promotion
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="block text-sm font-semibold text-gray-800">
                    Featured Product
                  </span>
                  <span className="block text-xs text-gray-500">
                    Display on homepage Featured row
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-burhan-secondary rounded focus:ring-burhan-secondary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="block text-sm font-semibold text-gray-800">
                    Trending Item
                  </span>
                  <span className="block text-xs text-gray-500">
                    Show orange TRENDING badge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isTrending}
                  onChange={e => setFormData({ ...formData, isTrending: e.target.checked })}
                  className="w-4 h-4 text-burhan-secondary rounded focus:ring-burhan-secondary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div>
                  <span className="block text-sm font-semibold text-gray-800">
                    New Arrival
                  </span>
                  <span className="block text-xs text-gray-500">
                    Show green NEW badge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={e => setFormData({ ...formData, isNew: e.target.checked })}
                  className="w-4 h-4 text-burhan-secondary rounded focus:ring-burhan-secondary"
                />
              </label>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3">
              Store Card Preview
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="aspect-square bg-gray-50 relative">
                {formData.images.length > 0 ? (
                  <img
                    src={formData.images[formData.coverIndex] || formData.images[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    No cover image
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {formData.isNew && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                  {calculatedDiscount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -{calculatedDiscount}%
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white">
                <p className="text-xs text-gray-400 uppercase font-medium">
                  {formData.category || 'Category'}
                </p>
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {formData.name || 'Product Name'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm text-burhan-primary">
                    PKR {Number(formData.price || 0).toLocaleString()}
                  </span>
                  {oldPriceNum > priceNum && (
                    <span className="text-xs text-gray-400 line-through">
                      PKR {oldPriceNum.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
