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
  Sparkles,
  Layers,
  DollarSign,
  Package,
  ShieldCheck,
  HelpCircle,
  Globe,
  SlidersHorizontal,
  Trash2,
  Check
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { key: 'Volume2', label: 'Audio / ANC (Volume)' },
  { key: 'BatteryCharging', label: 'Battery / Playtime' },
  { key: 'Zap', label: 'Speed / Low Latency' },
  { key: 'Mic', label: 'Microphone / Clear Calls' },
  { key: 'Radio', label: 'Bluetooth / Wireless' },
  { key: 'Droplets', label: 'Water / Sweat Proof' },
  { key: 'Sliders', label: 'Touch Controls' },
  { key: 'Package', label: 'Build / Hardware' },
  { key: 'ShieldCheck', label: 'Warranty / Quality' },
  { key: 'Sparkles', label: 'Special Feature' }
];

export default function ProductForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('basic');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Main Form Data State
  const [formData, setFormData] = useState({
    // Basic Info
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    brand: initialData?.brand || 'BURHAN',
    badge: initialData?.badge || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',

    // Pricing & Inventory
    price: initialData?.price !== undefined ? initialData.price : '',
    oldPrice: initialData?.oldPrice || '',
    costPrice: initialData?.costPrice || '',
    stock: initialData?.stock !== undefined ? initialData.stock : 15,
    lowStockThreshold: initialData?.lowStockThreshold || 5,
    status: initialData?.status || (initialData?.isActive === false ? 'inactive' : 'active'),
    isFeatured: Boolean(initialData?.isFeatured),
    isTrending: Boolean(initialData?.isTrending),
    isNew: initialData?.isNew !== undefined ? Boolean(initialData.isNew) : true,

    // Images
    images: Array.isArray(initialData?.images) && initialData.images.length > 0
      ? initialData.images
      : (initialData?.thumbnail ? [initialData.thumbnail] : []),
    coverIndex: 0,

    // Highlights (Array of strings)
    highlights: Array.isArray(initialData?.highlights) ? initialData.highlights : [],

    // Features (Array of { title, description, icon })
    features: Array.isArray(initialData?.features)
      ? initialData.features.map(f => typeof f === 'string' ? { title: f, description: '', icon: 'Sparkles' } : f)
      : [],

    // Specifications (Array of { key, value })
    specifications: initialData?.specifications && typeof initialData.specifications === 'object'
      ? (Array.isArray(initialData.specifications)
          ? initialData.specifications
          : Object.entries(initialData.specifications).map(([key, value]) => ({ key, value })))
      : [],

    // What's in the Box (Array of strings)
    inBox: Array.isArray(initialData?.inBox) ? initialData.inBox : [],

    // Warranty
    warrantyDuration: initialData?.warranty?.duration || (typeof initialData?.warranty === 'string' ? '6 Months' : '6 Months'),
    warrantyType: initialData?.warranty?.type || 'Replacement Warranty',
    warrantyDescription: initialData?.warranty?.description || (typeof initialData?.warranty === 'string' ? initialData.warranty : 'Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.'),
    warrantyTerms: Array.isArray(initialData?.warranty?.terms) ? initialData.warranty.terms : [
      'The product must be reasonably clean and suitable for inspection.',
      'The product must not have physical damage (cracks, broken parts, liquid damage, burn damage, or signs of misuse).',
      'The issue must be verified as an eligible internal product fault.',
      'Warranty claims are subject to inspection and verification by BURHAN.'
    ],

    // Delivery Info
    codAvailable: initialData?.deliveryInfo?.codAvailable !== undefined ? Boolean(initialData.deliveryInfo.codAvailable) : true,
    estimatedDays: initialData?.deliveryInfo?.estimatedDays || '1-3 Business Days',
    deliveryNotes: initialData?.deliveryInfo?.notes || 'Cash on delivery available across Pakistan with open parcel verification.',

    // FAQs (Array of { question, answer })
    faqs: Array.isArray(initialData?.faqs) ? initialData.faqs : [],

    // SEO
    seoTitle: initialData?.seo?.title || '',
    seoDescription: initialData?.seo?.description || '',
    seoOgImage: initialData?.seo?.ogImage || ''
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
        sku: initialData.sku || '',
        category: initialData.category || '',
        brand: initialData.brand || 'BURHAN',
        badge: initialData.badge || '',
        shortDescription: initialData.shortDescription || '',
        description: initialData.description || '',

        price: initialData.price !== undefined ? initialData.price : '',
        oldPrice: initialData.oldPrice || '',
        costPrice: initialData.costPrice || '',
        stock: initialData.stock !== undefined ? initialData.stock : 15,
        lowStockThreshold: initialData.lowStockThreshold || 5,
        status: initialData.status || (initialData.isActive === false ? 'inactive' : 'active'),
        isFeatured: Boolean(initialData.isFeatured),
        isTrending: Boolean(initialData.isTrending),
        isNew: initialData.isNew !== undefined ? Boolean(initialData.isNew) : true,

        images: imgs,
        coverIndex: coverIdx,

        highlights: Array.isArray(initialData.highlights) ? initialData.highlights : [],
        features: Array.isArray(initialData.features)
          ? initialData.features.map(f => typeof f === 'string' ? { title: f, description: '', icon: 'Sparkles' } : f)
          : [],
        specifications: initialData.specifications && typeof initialData.specifications === 'object'
          ? (Array.isArray(initialData.specifications)
              ? initialData.specifications
              : Object.entries(initialData.specifications).map(([key, value]) => ({ key, value })))
          : [],
        inBox: Array.isArray(initialData.inBox) ? initialData.inBox : [],

        warrantyDuration: initialData?.warranty?.duration || (typeof initialData?.warranty === 'string' ? '6 Months' : '6 Months'),
        warrantyType: initialData?.warranty?.type || 'Replacement Warranty',
        warrantyDescription: initialData?.warranty?.description || (typeof initialData?.warranty === 'string' ? initialData.warranty : 'Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.'),
        warrantyTerms: Array.isArray(initialData?.warranty?.terms) ? initialData.warranty.terms : [
          'The product must be reasonably clean and suitable for inspection.',
          'The product must not have physical damage (cracks, broken parts, liquid damage, burn damage, or signs of misuse).',
          'The issue must be verified as an eligible internal product fault.',
          'Warranty claims are subject to inspection and verification by BURHAN.'
        ],

        codAvailable: initialData?.deliveryInfo?.codAvailable !== undefined ? Boolean(initialData.deliveryInfo.codAvailable) : true,
        estimatedDays: initialData?.deliveryInfo?.estimatedDays || '1-3 Business Days',
        deliveryNotes: initialData?.deliveryInfo?.notes || 'Cash on delivery available across Pakistan with open parcel verification.',

        faqs: Array.isArray(initialData.faqs) ? initialData.faqs : [],

        seoTitle: initialData?.seo?.title || '',
        seoDescription: initialData?.seo?.description || '',
        seoOgImage: initialData?.seo?.ogImage || ''
      });
    }
  }, [initialData]);

  // Auto-generate slug from name
  const handleAutoSlug = () => {
    if (!formData.name.trim()) return;
    const clean = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug: clean }));
  };

  // Auto-generate SKU
  const handleGenerateSKU = () => {
    const prefix = (formData.category ? formData.category.slice(0, 3).toUpperCase() : 'BUR');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${randomNum}` }));
  };

  // Multiple File Upload Handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: uploadFormData
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to upload ${file.name}`);
        }
        const data = await res.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Add Image by URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    try {
      new URL(imageUrlInput.trim());
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrlInput.trim()]
      }));
      setImageUrlInput('');
    } catch {
      setError('Please enter a valid HTTP/HTTPS image URL.');
    }
  };

  // Remove Image
  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const updated = prev.images.filter((_, i) => i !== index);
      let newCover = prev.coverIndex;
      if (newCover >= updated.length) newCover = Math.max(0, updated.length - 1);
      return {
        ...prev,
        images: updated,
        coverIndex: newCover
      };
    });
  };

  // Feature Card Handlers
  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { title: '', description: '', icon: 'Sparkles' }]
    }));
  };

  const handleUpdateFeature = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Specification Row Handlers
  const handleAddSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const handleUpdateSpecification = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.specifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, specifications: updated };
    });
  };

  const handleRemoveSpecification = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  // In the Box Handlers
  const handleAddInBoxItem = () => {
    setFormData(prev => ({
      ...prev,
      inBox: [...prev.inBox, '']
    }));
  };

  const handleUpdateInBoxItem = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.inBox];
      updated[index] = value;
      return { ...prev, inBox: updated };
    });
  };

  const handleRemoveInBoxItem = (index) => {
    setFormData(prev => ({
      ...prev,
      inBox: prev.inBox.filter((_, i) => i !== index)
    }));
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const handleUpdateFaq = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  const handleRemoveFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Warranty Terms Bullet Handlers
  const handleAddWarrantyTerm = () => {
    setFormData(prev => ({
      ...prev,
      warrantyTerms: [...prev.warrantyTerms, '']
    }));
  };

  const handleUpdateWarrantyTerm = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.warrantyTerms];
      updated[index] = value;
      return { ...prev, warrantyTerms: updated };
    });
  };

  const handleRemoveWarrantyTerm = (index) => {
    setFormData(prev => ({
      ...prev,
      warrantyTerms: prev.warrantyTerms.filter((_, i) => i !== index)
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Product Name is required.');
      setActiveTab('basic');
      return;
    }
    if (!formData.category) {
      setError('Please select a category.');
      setActiveTab('basic');
      return;
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      setError('Please enter a valid sale price.');
      setActiveTab('pricing');
      return;
    }

    let activeImages = [...formData.images];
    if (activeImages.length === 0 && imageUrlInput.trim()) {
      activeImages = [imageUrlInput.trim()];
    }
    if (activeImages.length === 0) {
      activeImages = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];
    }

    setLoading(true);

    try {
      const coverImage = activeImages[formData.coverIndex] || activeImages[0];
      const orderedImages = [
        coverImage,
        ...activeImages.filter((_, idx) => idx !== formData.coverIndex)
      ];

      // Convert specifications array to object map for storage compatibility
      const specsMap = {};
      formData.specifications.forEach(s => {
        if (s.key && s.key.trim()) {
          specsMap[s.key.trim()] = s.value ? s.value.trim() : '';
        }
      });

      // Filter empty items
      const cleanFeatures = formData.features.filter(f => f.title && f.title.trim());
      const cleanInBox = formData.inBox.filter(item => typeof item === 'string' && item.trim());
      const cleanFaqs = formData.faqs.filter(f => f.question && f.question.trim());
      const cleanWarrantyTerms = formData.warrantyTerms.filter(t => typeof t === 'string' && t.trim());

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug ? formData.slug.trim() : '',
        sku: formData.sku.trim(),
        category: formData.category,
        brand: formData.brand.trim() || 'BURHAN',
        badge: formData.badge.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),

        price: parseFloat(formData.price),
        oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        stock: parseInt(formData.stock, 10) >= 0 ? parseInt(formData.stock, 10) : 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 5,

        status: formData.status,
        isActive: formData.status === 'active',
        visible: formData.status === 'active',
        isFeatured: formData.isFeatured,
        isTrending: formData.isTrending,
        isNew: formData.isNew,

        images: orderedImages,
        thumbnail: coverImage,

        highlights: formData.highlights.length > 0 ? formData.highlights : cleanFeatures.map(f => f.title).slice(0, 6),
        features: cleanFeatures,
        specifications: specsMap,
        inBox: cleanInBox,

        warranty: {
          duration: formData.warrantyDuration.trim() || '6 Months',
          type: formData.warrantyType.trim() || 'Replacement Warranty',
          description: formData.warrantyDescription.trim() || 'Your BURHAN product is covered for eligible internal product issues for 6 months from the date of purchase.',
          terms: cleanWarrantyTerms
        },

        deliveryInfo: {
          codAvailable: formData.codAvailable,
          estimatedDays: formData.estimatedDays.trim() || '1-3 Business Days',
          shippingFee: 200,
          freeShippingThreshold: 5000,
          notes: formData.deliveryNotes.trim()
        },

        faqs: cleanFaqs,

        seo: {
          title: formData.seoTitle.trim() || `${formData.name.trim()} | BURHAN STORE`,
          description: formData.seoDescription.trim() || formData.shortDescription.trim() || formData.description.trim().slice(0, 150),
          ogImage: formData.seoOgImage.trim() || coverImage
        }
      };

      const productId = initialData?._id || initialData?.id || initialData?.slug;
      const url = isEdit
        ? `/api/admin/products/${productId}`
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

      if (data.approvalRequired) {
        setSuccessMsg(data.message || 'Submitted for Store Owner approval!');
      } else {
        setSuccessMsg(isEdit ? 'Product updated successfully in database!' : 'Product created successfully in database!');
      }

      setTimeout(() => {
        window.location.href = '/admin/products';
      }, 700);
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Layers },
    { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'features', label: 'Key Features', icon: Sparkles },
    { id: 'specs', label: 'Specifications', icon: SlidersHorizontal },
    { id: 'inbox', label: "What's in the Box", icon: Package },
    { id: 'warranty', label: 'Warranty & Delivery', icon: ShieldCheck },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    { id: 'seo', label: 'SEO', icon: Globe }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl pb-16">
      {/* Top Header Bar */}
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
              ? 'Changes saved here immediately update the database and public storefront'
              : 'Add a new product with full specifications, features, warranty, and imagery'}
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
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Navigation Controls */}
      <div className="flex space-x-1 overflow-x-auto border-b border-gray-200 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <IconComp className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BASIC INFO */}
      {/* ========================================================================= */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. BURHAN Pro 2"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  URL Slug (Unique)
                </label>
                <button
                  type="button"
                  onClick={handleAutoSlug}
                  className="text-[11px] font-semibold text-cyan-700 hover:underline"
                >
                  Auto-generate
                </button>
              </div>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. burhan-pro-2"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white font-mono text-xs"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Public URL: /shop/{formData.slug || 'product-slug'}</span>
            </div>

            {/* SKU */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  SKU (Stock Keeping Unit)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="text-[11px] font-semibold text-cyan-700 hover:underline"
                >
                  Generate SKU
                </button>
              </div>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. BRH-PRO2-001"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white font-mono text-xs"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Wireless Earbuds">Wireless Earbuds</option>
                <option value="Headphones">Headphones</option>
                <option value="Chargers">Chargers</option>
                <option value="Power Banks">Power Banks</option>
                <option value="Smart Watches">Smart Watches</option>
                <option value="Gaming Accessories">Gaming Accessories</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. BURHAN"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Badge */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Promotional Badge
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['Flagship Audio', 'Best Seller', 'New Release', 'Sale', 'Limited Edition'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, badge: b })}
                    className={`px-3 py-1 rounded-md text-xs font-semibold border ${
                      formData.badge === b
                        ? 'bg-slate-900 text-cyan-300 border-slate-900'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {b}
                  </button>
                ))}
                {formData.badge && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, badge: '' })}
                    className="text-xs text-red-600 hover:underline px-2"
                  >
                    Clear Badge
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="Custom Badge text (e.g. Flagship Audio)"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Short Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Short Description (Card & Value Proposition)
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="e.g. Powerful sound, Hybrid ANC, clear calls and ultra-low latency — built for music, gaming and everyday use."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Full Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Full Product Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed information regarding design, sound staging, comfort, and real-world performance..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRICING & INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Sale Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Sale Price (PKR) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="7499"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-base font-bold focus:outline-none focus:border-cyan-500 bg-white"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">Customer payable price</span>
            </div>

            {/* Old / Regular Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Regular / Old Price (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.oldPrice}
                onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                placeholder="9999"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-base text-gray-500 focus:outline-none focus:border-cyan-500 bg-white"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">Shown strikethrough if higher</span>
            </div>

            {/* Cost Price (Private admin only!) */}
            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                Cost Price (Admin Only)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="Internal unit cost"
                className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-sm focus:outline-none bg-white"
              />
              <span className="text-[10px] text-amber-700 mt-1 block">Never exposed in public API</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {/* Stock Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Visibility Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-cyan-500 bg-white"
              >
                <option value="active">Active (Visible in Public Shop)</option>
                <option value="hidden">Hidden / Draft (Excluded from Storefront)</option>
                <option value="inactive">Inactive / Archived</option>
              </select>
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Featured Flagship</span>
                <span className="text-[11px] text-gray-500">Show in homepage showcases</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isTrending}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Trending</span>
                <span className="text-[11px] text-gray-500">Include in Trending lists</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">New Arrival</span>
                <span className="text-[11px] text-gray-500">Tag as newly arrived product</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMAGES */}
      {/* ========================================================================= */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Product Gallery</h2>
            <p className="text-xs text-gray-500 mb-4">
              Upload high-resolution images or paste direct URLs. Click a card to set it as Primary Cover.
            </p>

            {/* Input methods */}
            <div className="grid sm:grid-cols-12 gap-3 mb-6">
              {/* File upload input */}
              <div className="sm:col-span-7">
                <label className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-cyan-500 cursor-pointer bg-gray-50 hover:bg-cyan-50/30 transition-colors">
                  <UploadCloud className="w-5 h-5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    {uploading ? 'Uploading Image...' : 'Click to Upload Files from Computer'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL input */}
              <div className="sm:col-span-5 flex space-x-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-cyan-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-cyan-600 text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Gallery Grid */}
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {formData.images.map((img, idx) => {
                  const isCover = formData.coverIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group transition-all ${
                        isCover ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Set Cover Overlay */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverIndex: idx })}
                        className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCover ? 'bg-cyan-500 text-slate-950' : 'bg-black/60 text-white hover:bg-black'
                        }`}
                      >
                        {isCover ? '★ Cover' : 'Set Cover'}
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">
                No images added yet. Add at least one product image.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KEY FEATURES */}
      {/* ========================================================================= */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Feature Cards</h2>
              <p className="text-xs text-gray-500">
                These cards render dynamically in the product presentation section with icons.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold hover:bg-cyan-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Feature Card</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.features.map((feat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row gap-3 items-start">
                {/* Icon Selector */}
                <div className="w-full sm:w-44 flex-shrink-0">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Icon</label>
                  <select
                    value={feat.icon || 'Sparkles'}
                    onChange={(e) => handleUpdateFeature(idx, 'icon', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-medium"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.key} value={ic.key}>{ic.label}</option>
                    ))}
                  </select>
                </div>

                {/* Title & Description */}
                <div className="flex-1 space-y-2 w-full">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Feature Title *</label>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => handleUpdateFeature(idx, 'title', e.target.value)}
                      placeholder="e.g. 35dB Hybrid ANC"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Explanation</label>
                    <textarea
                      rows={2}
                      value={feat.description}
                      onChange={(e) => handleUpdateFeature(idx, 'description', e.target.value)}
                      placeholder="Brief customer-friendly explanation of why this matters..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                  aria-label="Remove feature"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.features.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                No feature cards configured. Click "Add Feature Card" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TECHNICAL SPECIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'specs' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Technical Specifications</h2>
              <p className="text-xs text-gray-500">
                Key-value rows displayed in the specifications table on the product page.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSpecification}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold hover:bg-cyan-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Specification Row</span>
            </button>
          </div>

          <div className="space-y-2">
            {formData.specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleUpdateSpecification(idx, 'key', e.target.value)}
                  placeholder="e.g. Bluetooth Version"
                  className="w-1/3 px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpecification(idx, 'value', e.target.value)}
                  placeholder="e.g. Bluetooth 5.3 + EDR Ultra-Fast"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecification(idx)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  aria-label="Remove specification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.specifications.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                No specifications configured. Click "Add Specification Row" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: WHAT'S IN THE BOX */}
      {/* ========================================================================= */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">What's in the Box</h2>
              <p className="text-xs text-gray-500">
                Items included in the retail package (cable, tips, documentation, etc.).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddInBoxItem}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold hover:bg-cyan-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {formData.inBox.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateInBoxItem(idx, e.target.value)}
                  placeholder="e.g. 3 Pairs Ergonomic Silicone Ear Tips (S, M, L)"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInBoxItem(idx)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.inBox.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                No package items listed yet. Click "Add Package Item" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: WARRANTY & DELIVERY */}
      {/* ========================================================================= */}
      {activeTab === 'warranty' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Warranty Duration
              </label>
              <input
                type="text"
                value={formData.warrantyDuration}
                onChange={(e) => setFormData({ ...formData, warrantyDuration: e.target.value })}
                placeholder="e.g. 6 Months"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Warranty Type
              </label>
              <input
                type="text"
                value={formData.warrantyType}
                onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                placeholder="e.g. Replacement Warranty"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Warranty Description
              </label>
              <textarea
                rows={2}
                value={formData.warrantyDescription}
                onChange={(e) => setFormData({ ...formData, warrantyDescription: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>
          </div>

          {/* Warranty Terms & Conditions Bullets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Warranty Terms & Qualification Criteria
              </label>
              <button
                type="button"
                onClick={handleAddWarrantyTerm}
                className="text-[11px] font-bold text-cyan-700 hover:underline"
              >
                + Add Term Bullet
              </button>
            </div>
            <div className="space-y-2">
              {formData.warrantyTerms.map((term, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">•</span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => handleUpdateWarrantyTerm(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveWarrantyTerm(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Configuration */}
          <div className="pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Estimated Delivery
              </label>
              <input
                type="text"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                placeholder="e.g. 1-3 Business Days"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Cash on Delivery Availability
              </label>
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.codAvailable}
                  onChange={(e) => setFormData({ ...formData, codAvailable: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
                <span className="text-xs font-bold text-gray-900">Cash on Delivery Supported</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAQS */}
      {/* ========================================================================= */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-xs text-gray-500">
                Interactive accordions displayed directly on the product detail page.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold hover:bg-cyan-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-800">FAQ #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                    placeholder="Question (e.g. Does it support wireless charging?)"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold bg-white"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                    placeholder="Answer for the customer..."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                  />
                </div>
              </div>
            ))}

            {formData.faqs.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-400">
                No FAQs added for this product yet. Click "Add FAQ" above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SEO */}
      {/* ========================================================================= */}
      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">Search Engine Optimization (SEO)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Customize title tags, meta descriptions, and social sharing OpenGraph card preview.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                SEO Title
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder={`${formData.name || 'Product'} | BURHAN STORE`}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="Brief summary for Google search snippet (up to 160 characters)..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                OpenGraph Share Image URL
              </label>
              <input
                type="url"
                value={formData.seoOgImage}
                onChange={(e) => setFormData({ ...formData, seoOgImage: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-cyan-500 bg-white"
              />
            </div>

            {/* Google Search Snippet Preview */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Google Search Preview</span>
              <div className="text-sm font-semibold text-blue-700 hover:underline truncate">
                {formData.seoTitle || `${formData.name || 'BURHAN Product'} | BURHAN STORE`}
              </div>
              <div className="text-xs text-emerald-800 truncate">
                https://burhanstore.com/shop/{formData.slug || 'product-slug'}
              </div>
              <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                {formData.seoDescription || formData.shortDescription || 'Buy authentic electronics and mobile accessories with cash on delivery across Pakistan at BURHAN STORE.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Action Bar */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
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
          className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving to Database...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Product</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
