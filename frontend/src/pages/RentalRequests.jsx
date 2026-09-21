import React, { useState, useEffect } from 'react';
import { requestsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  User,
  AlertCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const RentalRequests = () => {
  const { role, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reject Modal
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await requestsAPI.getAll(params);
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load rental requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      setProcessing(true);
      setActionError('');
      await requestsAPI.approve(id);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      setActionError('');
      await requestsAPI.reject(rejectModalId, { rejectionReason });
      setRejectModalId(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this rental request?')) return;
    try {
      await requestsAPI.cancel(id);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-amber-600" />
            Rental Reservation Requests
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Review equipment booking requests with automatic date interval overlap validation.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-1.5 bg-white"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading reservation requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-stone-400" />
            <p className="text-sm">No rental requests found in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Requested</th>
                  <th className="py-3 px-4 font-semibold">Borrower</th>
                  <th className="py-3 px-4 font-semibold">Rental Interval</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <Link
                          to={`/assets/${req.asset.id}`}
                          className="font-semibold text-stone-800 hover:text-amber-700 transition-colors"
                        >
                          {req.asset.name}
                        </Link>
                        <p className="text-[11px] font-mono text-stone-400">{req.asset.assetCode}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <div>
                        <p className="font-medium text-stone-700">{req.borrower?.name}</p>
                        <p className="text-[10px] text-stone-400">{req.borrower?.email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{new Date(req.startDate).toLocaleDateString()}</span>
                        <span className="text-stone-400">➔</span>
                        <span>{new Date(req.dueDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-400 max-w-xs truncate" title={req.purpose}>
                      {req.purpose}
                      {req.rejectionReason && (
                        <p className="text-red-600 text-[10px] mt-0.5">Declined: {req.rejectionReason}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin Approval/Rejection buttons */}
                        {role === 'ADMIN' && req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={processing}
                              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-green-700 border border-green-200 transition-colors"
                              title="Approve Request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectModalId(req.id)}
                              disabled={processing}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-rose-600/30 text-red-600 border border-red-200 transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Borrower Cancel button */}
                        {role === 'BORROWER' && req.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="text-xs text-red-600 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectModalId && (
        <Modal
          isOpen={Boolean(rejectModalId)}
          onClose={() => setRejectModalId(null)}
          title="Decline Rental Request"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify why this reservation is declined (e.g., scheduled maintenance, priority overlap)..."
                className="glass-input w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="btn-danger py-1.5 px-4 text-xs"
              >
                {processing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
