'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found or failed to load');
        return res.json();
      })
      .then(data => {
        if (!data.product) {
          throw new Error('Product data is empty');
        }
        setProduct(data.product);
      })
      .catch(err => {
        console.error('Failed to load product for editing:', err);
        setError(err.message || 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminLayout>
      <div className="pb-12">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-burhan-secondary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading product details...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto py-16 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-burhan-primary mb-2">Error Loading Product</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/admin/products')}
              className="inline-flex items-center px-6 py-3 bg-burhan-primary text-white rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Products
            </button>
          </div>
        ) : (
          <ProductForm initialData={product} isEdit={true} />
        )}
      </div>
    </AdminLayout>
  );
}
