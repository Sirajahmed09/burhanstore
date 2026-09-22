'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  CheckSquare, Check, X, AlertCircle, Clock, ShieldCheck,
  RefreshCw, User, Tag, Layers, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | ''
  const [user, setUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchApprovals();
  }, [filterStatus]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [meRes, appRes] = await Promise.all([
        fetch('/api/admin/auth/me'),
        fetch(`/api/admin/approvals${filterStatus ? `?status=${filterStatus}` : ''}`)
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      if (appRes.ok) {
        const data = await appRes.json();
        setApprovals(data.approvals || []);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      showToast('Error loading approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId, isApprove) => {
    const action = isApprove ? 'approve' : 'reject';
    const note = prompt(`Optional note for ${action.toUpperCase()}:`, isApprove ? 'Approved' : 'Rejected');
    if (note === null) return; // User cancelled prompt

    try {
      setActionLoading(approvalId);
      const res = await fetch(`/api/admin/approvals/${approvalId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote: note })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);

      showToast(`Request #${approvalId.slice(0, 8)} successfully ${isApprove ? 'approved & applied' : 'rejected'}`);
      // Refresh list
      fetchApprovals();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-white font-medium text-sm transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="font-heading text-3xl font-bold text-burhan-primary">
                Employee Change Approvals
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                Governance Workflow
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Store Owner approval queue for price changes, inventory updates, and deletion requests initiated by staff.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchApprovals}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-burhan-secondary' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
          {[
            { label: 'Pending Review', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'All Requests', value: '' },
          ].map(tab => (
            <button
              key={tab.label}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.value
                  ? 'bg-burhan-primary text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Approvals List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-xs border border-gray-100">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-burhan-secondary mb-2" />
            <p className="text-sm font-medium">Checking approval ledger...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-xs border border-gray-100">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
            <p className="text-xs text-gray-500 mt-1">
              There are no {filterStatus ? filterStatus.toLowerCase() : ''} change requests requiring action.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 hover:border-gray-300 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2.5 rounded-xl ${
                        req.actionType.includes('PRICE') ? 'bg-amber-100 text-amber-800' :
                        req.actionType.includes('DELETE') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-gray-900 text-base">
                            {req.targetName || req.targetId}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isPending ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Action: <strong className="text-gray-700">{req.actionType}</strong> on {req.targetCollection}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Requested by: <strong>{req.requestedBy?.name || req.requestedBy?.email}</strong> ({req.requestedBy?.role})</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Changes Preview */}
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-xs">
                      <span className="font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        Comparison &amp; Impact
                      </span>

                      {req.currentData && (
                        <div className="space-y-1 mb-2">
                          <span className="text-gray-500 font-medium">Current Values: </span>
                          {req.currentData.price !== undefined && (
                            <span className="text-gray-700">Price: PKR {Number(req.currentData.price).toLocaleString()} | </span>
                          )}
                          {req.currentData.stock !== undefined && (
                            <span className="text-gray-700">Stock: {req.currentData.stock} units</span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-burhan-secondary font-bold">Proposed Changes: </span>
                        {req.proposedChanges?.price !== undefined && (
                          <span className="text-emerald-700 font-bold">
                            New Price: PKR {Number(req.proposedChanges.price).toLocaleString()}{' '}
                          </span>
                        )}
                        {req.proposedChanges?.stock !== undefined && (
                          <span className="text-emerald-700 font-bold">
                            New Stock: {req.proposedChanges.stock} units
                          </span>
                        )}
                        {req.proposedChanges?.action === 'PERMANENT_DELETION' && (
                          <span className="text-red-700 font-bold">
                            Product will be PERMANENTLY deleted from catalog.
                          </span>
                        )}
                      </div>

                      {req.reviewNote && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                          <strong>Reviewer Note:</strong> {req.reviewNote} ({req.reviewedBy?.name})
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3">
                      {isPending ? (
                        isOwner ? (
                          <>
                            <button
                              disabled={actionLoading === req._id}
                              onClick={() => handleDecision(req._id, false)}
                              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject Request</span>
                            </button>
                            <button
                              disabled={actionLoading === req._id}
                              onClick={() => handleDecision(req._id, true)}
                              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve &amp; Apply to Store</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                            Awaiting Store Owner decision
                          </div>
                        )
                      ) : (
                        <div className="text-xs text-gray-500">
                          Decision recorded on {new Date(req.reviewedAt || req.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
