'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { Filter, Search, X, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { trackViewItemList, trackSearch } from '@/lib/analytics/gtag';

export default function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: initialCategory,
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    search: initialSearch,
    inStock: false,
    rating: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sync when URL search params change
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlSearch = searchParams.get('search') || '';
    setFilters(prev => {
      if (urlCategory !== prev.category || urlSearch !== prev.search) {
        return {
          ...prev,
          category: urlCategory,
          search: urlSearch
        };
      }
      return prev;
    });
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    fetch(`/api/categories?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { categories: [] }))
      .then(data => setCategories(data?.categories || []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Fetch products with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.search) params.append('search', filters.search);
    if (filters.inStock) params.append('inStock', 'true');
    if (filters.rating) params.append('rating', filters.rating);
    params.append('_t', Date.now().toString());

    setLoading(true);
    fetch(`/api/products?${params.toString()}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { products: [] }))
      .then(data => {
        const prods = data?.products || [];
        setProducts(prods);
        setLoading(false);
        if (prods.length > 0) {
          trackViewItemList(prods, filters.category || 'All Products');
        }
        if (filters.search) {
          trackSearch(filters.search);
        }
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      search: '',
      inStock: false,
      rating: ''
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
    filters.inStock,
    filters.rating
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 md:pt-24 pb-16 text-slate-900">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header Banner */}
        <div className="py-6 sm:py-8 border-b border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1">
                Official Catalog
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Shop All Products
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                Authentic electronics with nationwide cash on delivery across Pakistan
              </p>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-900">{products.length}</span> verified product{products.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Search, Sort, and Mobile Filter Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, wireless earbuds, accessories..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-2xs transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                aria-label="Clear search text"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs"
            >
              <option value="newest">Sort: Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center space-x-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs active:bg-slate-100"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>
        </div>

        {/* Main Layout Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Filters Sidebar */}
          <aside className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs md:sticky md:top-24 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-cyan-600" />
                  <h2 className="font-heading text-base font-bold text-slate-950">
                    Filter Products
                  </h2>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-semibold text-cyan-700 hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Category
                </h4>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className={filters.category === '' ? 'font-bold text-cyan-700' : 'text-slate-700'}>
                      All Categories
                    </span>
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === ''}
                      onChange={() => setFilters({ ...filters, category: '' })}
                      className="accent-cyan-600"
                    />
                  </label>
                  {categories.map((cat) => (
                    <label key={cat._id || cat.name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className={filters.category === cat.name ? 'font-bold text-cyan-700' : 'text-slate-700'}>
                        {cat.name}
                      </span>
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.name}
                        onChange={() => setFilters({ ...filters, category: cat.name })}
                        className="accent-cyan-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Price Range (PKR)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Stock Filter */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-600"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products Grid Column */}
          <main className="flex-1 w-full">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-xs">
                    <div className="aspect-square bg-slate-200 rounded-xl mb-4" />
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-6 bg-slate-200 rounded w-1/2 mb-4" />
                    <div className="h-9 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-950 mb-2">
                  No matching products found
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                  Try adjusting your search query, clearing filters, or browsing our full collection.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
