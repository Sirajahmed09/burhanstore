'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileText, Shield, User, Clock, Search, RefreshCw,
  Filter, CheckCircle, AlertTriangle, ArrowUpDown
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);
      params.append('limit', '150');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(s) ||
      (log.actor?.name || '').toLowerCase().includes(s) ||
      (log.actor?.email || '').toLowerCase().includes(s) ||
      (log.targetName || '').toLowerCase().includes(s) ||
      (log.targetId || '').toLowerCase().includes(s)
    );
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (action.includes('APPROVED')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('SUBMITTED')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="font-heading text-3xl font-bold text-burhan-primary">
                Security &amp; Audit Trail
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                Immutable Ledger
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Complete historical record of administrative logins, price edits, approval decisions, and inventory mutations.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-burhan-secondary' : ''}`} />
            <span>Refresh Audit Logs</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, or product..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-burhan-secondary font-medium"
            >
              <option value="">All Action Types</option>
              <option value="ADMIN_LOGIN">Admin Login</option>
              <option value="APPROVAL_REQUEST_SUBMITTED">Approval Submitted</option>
              <option value="APPROVAL_APPROVED_AND_COMMITTED">Approval Granted</option>
              <option value="APPROVAL_REJECTED">Approval Rejected</option>
              <option value="PRODUCT_UPDATED">Product Updated</option>
              <option value="PRODUCT_QUICK_UPDATED">Product Quick Edited</option>
              <option value="PRODUCT_DELETED">Product Deleted</option>
              <option value="EMPLOYEE_CREATED">Staff Created</option>
              <option value="EMPLOYEE_UPDATED">Staff Updated</option>
            </select>
          </div>

          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-burhan-secondary font-medium"
            >
              <option value="">All Entities</option>
              <option value="product">Products</option>
              <option value="employee">Staff / Team</option>
              <option value="approval">Approvals</option>
              <option value="order">Orders</option>
              <option value="settings">Settings</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">
              Recorded Events ({filteredLogs.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-burhan-secondary mb-2" />
              <p className="text-sm">Fetching audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">No audit events match current criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Actor</th>
                    <th className="px-6 py-3.5">Target Entity</th>
                    <th className="px-6 py-3.5">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                            {(log.actor?.name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{log.actor?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{log.actor?.email} ({log.actor?.role})</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">
                          {log.targetName || log.targetId || '-'}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">
                          Type: {log.targetType || 'system'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-600 font-mono text-[11px]">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
