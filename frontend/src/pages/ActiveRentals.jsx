import React, { useState, useEffect } from 'react';
import { rentalsAPI, assetsAPI, requestsAPI, inspectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PrePostComparisonModal } from '../components/inspection/PrePostComparisonModal';
import { exportToCSV } from '../utils/exportUtils';
import {
  Clock,
  Plus,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  User,
  ShieldCheck,
  Upload,
  Bell,
  Download,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActiveRentals = () => {
  const { role, user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reminderSending, setReminderSending] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Issue Asset Modal State (Staff)
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [issueForm, setIssueForm] = useState({
    assetId: '',
    borrowerId: '',
    dueDate: '',
    preCondition: 'EXCELLENT',
    preNotes: '',
    prePhotos: []
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Comparison Modal
  const [comparisonRentalId, setComparisonRentalId] = useState(null);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await rentalsAPI.getAll(params);
      if (res.data.success) {
        setRentals(res.data.rentals);
      }
    } catch (err) {
      console.error('Failed to load rentals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [statusFilter]);

  // Load candidate approved requests & assets for issue modal
  const handleOpenIssueModal = async () => {
    try {
      const [reqRes, assetRes] = await Promise.all([
        requestsAPI.getAll({ status: 'APPROVED' }),
        assetsAPI.getAll({ status: 'AVAILABLE' })
      ]);

      if (reqRes.data.success) setApprovedRequests(reqRes.data.requests);
      if (assetRes.data.success) setAvailableAssets(assetRes.data.assets);
      setIssueModalOpen(true);
    } catch (err) {
      console.error('Failed to load issue candidates', err);
    }
  };

  // When staff selects an approved request from dropdown, autofill asset and borrower
  const handleSelectApprovedRequest = (reqId) => {
    setSelectedRequestId(reqId);
    if (!reqId) {
      setIssueForm({ ...issueForm, assetId: '', borrowerId: '', dueDate: '' });
      return;
    }
    const found = approvedRequests.find(r => r.id === reqId);
    if (found) {
      setIssueForm({
        ...issueForm,
        assetId: found.assetId,
        borrowerId: found.borrowerId,
        dueDate: found.dueDate.split('T')[0]
      });
    }
  };

  // Photo upload handler for pre-issue evidence
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));

      const res = await inspectionAPI.uploadPhotos(formData);
      if (res.data.success) {
        setIssueForm(prev => ({
          ...prev,
          prePhotos: [...prev.prePhotos, ...res.data.photoUrls]
        }));
      }
    } catch (err) {
      alert('Photo upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Submit Issue Asset
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.assetId || !issueForm.borrowerId || !issueForm.dueDate) {
      setIssueError('Asset, borrower, and due date are required.');
      return;
    }

    try {
      setIssueSubmitting(true);
      setIssueError('');
      const res = await rentalsAPI.issue({
        requestId: selectedRequestId || undefined,
        ...issueForm
      });

      if (res.data.success) {
        setIssueModalOpen(false);
        setIssueForm({
          assetId: '',
          borrowerId: '',
          dueDate: '',
          preCondition: 'EXCELLENT',
          preNotes: '',
          prePhotos: []
        });
        fetchRentals();
      }
    } catch (err) {
      setIssueError(err.response?.data?.message || 'Failed to issue asset.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // Borrower initiates return
  const handleInitiateReturn = async (rentalId) => {
    if (!window.confirm('Initiate return check-in for this equipment? Staff will conduct a return inspection.')) return;
    try {
      await rentalsAPI.initiateReturn(rentalId);
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate return.');
    }
  };

  // Staff/Admin dispatches due/overdue reminder to borrower
  const handleSendReminder = async (rentalId) => {
    try {
      setReminderSending(rentalId);
      const res = await rentalsAPI.sendReminder(rentalId);
      setFeedbackMsg(res.data.message || 'Return reminder dispatched.');
      setTimeout(() => setFeedbackMsg(''), 4500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch reminder.');
    } finally {
      setReminderSending(null);
    }
  };

  const handleExportRentals = () => {
    exportToCSV(rentals, 'rentiq-deployments-report', [
      { key: 'asset.assetCode', label: 'Asset Code' },
      { key: 'asset.name', label: 'Equipment Name' },
      { key: 'borrower.name', label: 'Borrower' },
      { key: 'borrower.email', label: 'Borrower Email' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issued Date' },
      { key: 'dueDate', label: 'Due Date' }
    ]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Toast Banner */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-between text-xs animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            {feedbackMsg}
          </span>
          <button onClick={() => setFeedbackMsg('')} className="text-green-600 hover:text-stone-900 text-xs">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-600" />
            Equipment Deployments & Active Rentals
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Track active checkouts, pre-issue condition baselines, and initiate return check-ins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="OVERDUE">Overdue Only</option>
            <option value="RETURN_INITIATED">Return Initiated</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <button
            type="button"
            onClick={handleExportRentals}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Download CSV report of rentals"
          >
            <Download className="w-4 h-4 text-green-600" /> Export CSV
          </button>

          {(role === 'STAFF' || role === 'ADMIN') && (
            <button
              onClick={handleOpenIssueModal}
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Issue Asset to Borrower
            </button>
          )}
        </div>
      </div>

      {/* Rentals Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading rental records...</p>
          </div>
        ) : rentals.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-stone-400" />
            <p className="text-sm">No rentals found in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset</th>
                  <th className="py-3 px-4 font-semibold">Borrower</th>
                  <th className="py-3 px-4 font-semibold">Issued Date</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Pre-Condition</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <Link
                          to={`/assets/${r.asset.id}`}
                          className="font-semibold text-stone-800 hover:text-amber-700"
                        >
                          {r.asset.name}
                        </Link>
                        <p className="text-[11px] font-mono text-stone-400">{r.asset.assetCode}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <p className="font-medium text-stone-700">{r.borrower?.name}</p>
                      <p className="text-[10px] text-stone-400">{r.borrower?.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {new Date(r.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={r.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-stone-600'}>
                        {new Date(r.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <ConditionBadge condition={r.preCondition} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Staff/Admin Send Return Reminder */}
                        {(role === 'STAFF' || role === 'ADMIN') && ['ACTIVE', 'OVERDUE'].includes(r.status) && (
                          <button
                            onClick={() => handleSendReminder(r.id)}
                            disabled={reminderSending === r.id}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 flex items-center gap-1 text-[11px] font-medium transition-colors disabled:opacity-50"
                            title="Dispatch return reminder notification to borrower"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{reminderSending === r.id ? 'Sending...' : 'Remind'}</span>
                          </button>
                        )}

                        {/* Borrower or Staff can Initiate Return */}
                        {['ACTIVE', 'OVERDUE'].includes(r.status) && (
                          <button
                            onClick={() => handleInitiateReturn(r.id)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-200 flex items-center gap-1 text-[11px] font-medium transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                        )}

                        {/* If Return Initiated: Staff can jump to digital inspection */}
                        {(role === 'STAFF' || role === 'ADMIN') && r.status === 'RETURN_INITIATED' && (
                          <Link
                            to="/inspections"
                            className="btn-primary py-1 px-2.5 text-[11px]"
                          >
                            Inspect Now
                          </Link>
                        )}

                        {/* View Pre/Post Comparison if inspected */}
                        {r.conditions && r.conditions.length > 0 && (
                          <button
                            onClick={() => setComparisonRentalId(r.id)}
                            className="p-1.5 rounded hover:bg-stone-100 text-amber-600 hover:text-amber-700 transition-colors"
                            title="Compare Pre-issue vs Post-return condition"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* Staff Issue Asset Modal */}
      {issueModalOpen && (
        <Modal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          title="Issue Equipment to Borrower"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            {/* Quick autofill from approved requests */}
            {approvedRequests.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <label className="block text-amber-700 font-semibold">
                  Autofill from Approved Reservation Request:
                </label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => handleSelectApprovedRequest(e.target.value)}
                  className="glass-input w-full text-xs bg-white"
                >
                  <option value="">-- Choose Approved Reservation (Optional) --</option>
                  {approvedRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.asset.name} ({req.asset.assetCode}) ➔ {req.borrower.name} (Due: {new Date(req.dueDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Asset</label>
                <select
                  required
                  value={issueForm.assetId}
                  onChange={(e) => setIssueForm({ ...issueForm, assetId: e.target.value })}
                  className="glass-input w-full text-xs bg-white"
                >
                  <option value="">Select Asset</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetCode})
                    </option>
                  ))}
                  {/* Also include currently selected asset if from request */}
                  {selectedRequestId && approvedRequests.find(r => r.id === selectedRequestId)?.asset && (
                    <option value={approvedRequests.find(r => r.id === selectedRequestId).asset.id}>
                      {approvedRequests.find(r => r.id === selectedRequestId).asset.name} (From Request)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={issueForm.dueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Pre-Issue Condition Baseline</label>
                <select
                  value={issueForm.preCondition}
                  onChange={(e) => setIssueForm({ ...issueForm, preCondition: e.target.value })}
                  className="glass-input w-full text-xs bg-white"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Borrower ID</label>
                <input
                  type="text"
                  required
                  value={issueForm.borrowerId}
                  onChange={(e) => setIssueForm({ ...issueForm, borrowerId: e.target.value })}
                  placeholder="Borrower UUID or selected above"
                  className="glass-input w-full text-xs font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-stone-600 font-medium mb-1">Pre-Issue Notes & Checklist</label>
                <textarea
                  rows={2}
                  value={issueForm.preNotes}
                  onChange={(e) => setIssueForm({ ...issueForm, preNotes: e.target.value })}
                  placeholder="e.g. Cables, batteries, and case included. Optical elements inspected and clear..."
                  className="glass-input w-full text-xs"
                />
              </div>

              {/* Pre-Issue Photographic Evidence */}
              <div className="col-span-2">
                <label className="block text-stone-600 font-medium mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  Pre-Issue Photo Evidence (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="btn-secondary py-2 px-3 text-xs cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingPhotos ? 'Uploading...' : 'Attach Photos'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhotos}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {issueForm.prePhotos.length} photo(s) attached
                  </span>
                </div>

                {issueForm.prePhotos.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                    {issueForm.prePhotos.map((url, i) => (
                      <img
                        key={i}
                        src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                        alt="Pre-issue evidence"
                        className="w-14 h-14 rounded-lg object-cover border border-stone-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {issueError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {issueError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={issueSubmitting}
                className="btn-primary py-1.5 px-4 text-xs font-semibold"
              >
                {issueSubmitting ? 'Recording Issue...' : 'Confirm & Issue Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Side-by-Side Comparison Modal */}
      {comparisonRentalId && (
        <PrePostComparisonModal
          isOpen={Boolean(comparisonRentalId)}
          onClose={() => setComparisonRentalId(null)}
          rentalId={comparisonRentalId}
        />
      )}
    </div>
  );
};
