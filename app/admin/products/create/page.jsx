'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';

export default function CreateProductPage() {
  return (
    <AdminLayout>
      <div className="pb-12">
        <ProductForm isEdit={false} />
      </div>
    </AdminLayout>
  );
}
