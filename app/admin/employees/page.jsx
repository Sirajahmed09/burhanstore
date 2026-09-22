'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users, UserPlus, Shield, Key, Trash2, Edit2, CheckCircle2,
  AlertTriangle, RefreshCw, X, Check, Lock, Mail, ShieldAlert
} from 'lucide-react';

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeEmployee, setActiveEmployee] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    status: 'active'
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [meRes, empRes] = await Promise.all([
        fetch('/api/admin/auth/me'),
        fetch('/api/admin/employees')
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      } else if (empRes.status === 403) {
        showToast('Unauthorized: Only store owners can view employee management.', 'error');
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
      showToast('Error loading team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        showToast('Team roster refreshed');
      }
    } catch (err) {
      showToast('Refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setActiveEmployee(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      status: 'active'
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalMode('edit');
    setActiveEmployee(emp);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      password: '', // Leave blank unless changing
      role: emp.role || 'employee',
      status: emp.status || 'active'
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/admin/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create team member');
        }

        setEmployees(prev => [data.employee, ...prev]);
        showToast(`Team member ${data.employee.name} added successfully`);
        setModalOpen(false);
      } else {
        // Edit mode
        const res = await fetch(`/api/admin/employees/${activeEmployee._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update team member');
        }

        setEmployees(prev => prev.map(emp => emp._id === activeEmployee._id ? data.employee : emp));
        showToast(`Account updated for ${data.employee.name}`);
        setModalOpen(false);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteEmployee = async (emp) => {
    if (emp._id === 'admin-owner-siraj' || emp.email === 'siraj@mainadmin') {
      alert('The primary store owner account cannot be deleted.');
      return;
    }

    if (emp._id === currentUser?.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to permanently delete account for "${emp.name}" (${emp.email})?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/employees/${emp._id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      setEmployees(prev => prev.filter(e => e._id !== emp._id));
      showToast(`Account for ${emp.name} deleted.`);
    } catch (err) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-white font-medium text-sm transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="font-heading text-3xl font-bold text-burhan-primary">
                Team &amp; Employee Management
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                Owner Authority Zone
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Add staff accounts, configure role boundaries (Owner, Manager, Employee), and govern catalog edit privileges.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
              title="Refresh roster"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-burhan-secondary' : ''}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 bg-burhan-primary hover:bg-burhan-secondary text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        {/* Roles Policy Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Owner Role (Unrestricted)</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Full authority: Manage staff accounts, review &amp; approve catalog change requests, set prices, and delete products directly without approval.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Manager Role</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Can manage catalog and process orders directly. Destructive operations (e.g. deleting products/orders) require Owner approval.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Employee Role (Governed)</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Day-to-day operations. Any price change, stock update, or deletion creates a <strong>Pending Approval Request</strong> for the Store Owner.
            </p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-burhan-secondary" />
              <span className="font-bold text-sm text-gray-900">Active Staff Accounts ({employees.length})</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-burhan-secondary mb-2" />
              <p className="text-sm">Loading staff directory...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-base font-semibold">No team accounts found</p>
              <p className="text-xs mt-1">Click &ldquo;Add Staff Member&rdquo; above to onboard your team.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Staff Member</th>
                    <th className="px-6 py-3.5">Email / Username</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Created At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {employees.map((emp) => {
                    const isSelf = emp._id === currentUser?.id;
                    const isPrimaryOwner = emp._id === 'admin-owner-siraj' || emp.email === 'siraj@mainadmin';

                    return (
                      <tr key={emp._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-burhan-primary to-slate-700 text-white flex items-center justify-center font-bold text-xs">
                              {(emp.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900">{emp.name}</span>
                              {isSelf && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                              {isPrimaryOwner && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Founder
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-600">
                          {emp.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            emp.role === 'owner' || emp.role === 'superadmin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : emp.role === 'manager'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <Shield className="w-3 h-3 mr-1 inline" />
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            emp.status === 'inactive' || emp.status === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {emp.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Initial'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Account / Reset Password"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isPrimaryOwner && !isSelf && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-burhan-primary text-white">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-burhan-secondary" />
                  <h3 className="font-bold text-base">
                    {modalMode === 'create' ? 'Create Team Account' : `Edit Account: ${activeEmployee?.name}`}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-white/80 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="e.g. Bilal Store Assistant"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Email / Login Username
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="e.g. employee1@store"
                  />
                  {modalMode === 'edit' && (
                    <span className="text-[11px] text-gray-400 mt-0.5 block">Email cannot be changed after creation.</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {modalMode === 'create' ? 'Password' : 'New Password (Leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    required={modalMode === 'create'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    placeholder="Enter secure password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    >
                      <option value="employee">Employee (Governed)</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner (Full Authority)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  {formData.role === 'employee' && (
                    <span><strong>Employee Policy:</strong> Any product price adjustments, stock changes, or deletions requested by this account will require your approval before going live.</span>
                  )}
                  {formData.role === 'manager' && (
                    <span><strong>Manager Policy:</strong> Can adjust product prices and stock directly. Product and order deletions require your approval.</span>
                  )}
                  {formData.role === 'owner' && (
                    <span><strong>Owner Policy:</strong> Full uninhibited access to all store operations and team settings.</span>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2 bg-burhan-primary hover:bg-burhan-secondary text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                  >
                    {formSaving ? 'Saving...' : (modalMode === 'create' ? 'Create Account' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
