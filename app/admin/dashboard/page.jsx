'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  DollarSign, ShoppingCart, Package, TrendingUp, 
  AlertCircle, CheckCircle, X, Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const widgets = [
    {
      title: "Today's Revenue",
      value: `PKR ${stats?.todayRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Total Revenue',
      value: `PKR ${stats?.totalRevenue?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500'
    },
    {
      title: 'Completed Orders',
      value: stats?.completedOrders || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Cancelled Orders',
      value: stats?.cancelledOrders || 0,
      icon: X,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Low Stock Products',
      value: stats?.lowStockProducts || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    }
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="font-heading text-3xl font-bold text-burhan-primary mb-8">
          Dashboard Overview
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {widgets.map((widget, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${widget.color} rounded-xl flex items-center justify-center`}>
                  <widget.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{widget.title}</p>
              <p className={`text-2xl font-bold ${widget.textColor}`}>
                {widget.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="/admin/products"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <Package className="w-12 h-12 text-burhan-secondary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-heading text-lg font-semibold text-burhan-primary mb-2">
              Manage Products
            </h3>
            <p className="text-sm text-gray-600">
              Add, edit, or remove products from your catalog
            </p>
          </a>

          <a
            href="/admin/orders"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <ShoppingCart className="w-12 h-12 text-burhan-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-heading text-lg font-semibold text-burhan-primary mb-2">
              View Orders
            </h3>
            <p className="text-sm text-gray-600">
              Process and manage customer orders
            </p>
          </a>

          <a
            href="/admin/categories"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <FolderOpen className="w-12 h-12 text-burhan-success mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-heading text-lg font-semibold text-burhan-primary mb-2">
              Categories
            </h3>
            <p className="text-sm text-gray-600">
              Organize products into categories
            </p>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
