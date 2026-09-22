'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, FolderOpen, 
  Settings, LogOut, Menu, X, ShieldCheck, CheckSquare, 
  FileText, Shield, UserCircle, Bell
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);

      // Fetch pending approvals count if owner or manager
      if (['owner', 'superadmin', 'manager'].includes(data.user?.role)) {
        const statsRes = await fetch('/api/admin/dashboard/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPendingApprovalsCount(statsData.pendingApprovalsCount || 0);
        }
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';
  const isManager = user?.role === 'manager';

  // Dynamic menu items based on Role and Permissions
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', show: true },
    { icon: Package, label: 'Products', href: '/admin/products', show: true },
    { icon: FolderOpen, label: 'Categories', href: '/admin/categories', show: true },
    { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', show: true },
    {
      icon: CheckSquare,
      label: 'Approvals',
      href: '/admin/approvals',
      show: true,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null
    },
    { icon: Users, label: 'Team & Staff', href: '/admin/employees', show: isOwner },
    { icon: FileText, label: 'Audit Logs', href: '/admin/audit', show: isOwner || isManager },
    { icon: Settings, label: 'Settings', href: '/admin/settings', show: isOwner },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-burhan-primary text-white transition-all duration-300 flex flex-col z-30 shadow-xl`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-burhan-secondary flex items-center justify-center font-black text-white text-sm">
                  B
                </div>
                <div>
                  <h1 className="font-heading text-lg font-bold tracking-tight">Burhan Store</h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-burhan-secondary block">
                    Admin Portal
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
              aria-label="Toggle navigation sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Current User Badge */}
        {sidebarOpen && user && (
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white shadow-xs text-sm">
              {(user.name || 'Admin')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                  isOwner ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  <Shield className="w-2.5 h-2.5 mr-1 inline" />
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-burhan-secondary text-white shadow-sm font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm">{item.label}</span>}
                </div>
                {sidebarOpen && item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full animate-pulse shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full text-sm font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
