import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assetsAPI, requestsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { QRViewerModal } from '../components/qr/QRViewerModal';
import { PrePostComparisonModal } from '../components/inspection/PrePostComparisonModal';
import { AvailabilityTimeline } from '../components/assets/AvailabilityTimeline';
import { Modal } from '../components/common/Modal';
import {
  ArrowLeft,
  QrCode,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileText,
  History,
  Wrench,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [comparisonRentalId, setComparisonRentalId] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Request Form
  const [requestForm, setRequestForm] = useState({ startDate: '', dueDate: '', purpose: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMsg, setRequestMsg] = useState({ error: '', success: '' });

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await assetsAPI.getById(id);
      if (res.data.success) {
        setAsset(res.data.asset);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Asset not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      setRequestSubmitting(true);
      setRequestMsg({ error: '', success: '' });
      const res = await requestsAPI.create({
        assetId: asset.id,
        startDate: requestForm.startDate,
        dueDate: requestForm.dueDate,
        purpose: requestForm.purpose
      });

      if (res.data.success) {
        setRequestMsg({ error: '', success: 'Rental request submitted successfully!' });
        setTimeout(() => {
          setRequestModalOpen(false);
          setRequestMsg({ error: '', success: '' });
          fetchAssetDetails();
        }, 1500);
      }
    } catch (err) {
      setRequestMsg({ error: err.response?.data?.message || 'Failed to submit request.', success: '' });
    } finally {
      setRequestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-400 min-h-[50vh] flex items-center justify-center">
        <div>
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Resolving QR Asset Target...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-600">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-600" />
          <h3 className="font-semibold text-lg">Asset Identification Error</h3>
          <p className="text-xs mt-1 text-red-600/80">{error || 'Asset not located in system.'}</p>
        </div>
        <Link to="/assets" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Asset Catalog
        </Link>
      </div>
    );
  }

  // Parse specifications
  let specsObj = null;
  if (asset.specifications) {
    try {
      specsObj = JSON.parse(asset.specifications);
    } catch {
      specsObj = null;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-amber-600" /> View QR Code
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="glass-card overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8">
        {/* Asset Photo Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 min-h-[260px] flex items-center justify-center">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Cpu className="w-16 h-16 text-stone-600" />
          )}
          <div className="absolute top-3 left-3">
            <StatusBadge status={asset.status} />
          </div>
          <div className="absolute top-3 right-3">
            <ConditionBadge condition={asset.currentCondition} />
          </div>
        </div>

        {/* Asset Core Details (2 cols) */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                {asset.assetCode}
              </span>
              <span className="text-xs text-stone-400 font-medium">{asset.category?.name}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              {asset.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {asset.description || 'No equipment description recorded.'}
            </p>
          </div>

          {/* Specifications Grid */}
          {specsObj && typeof specsObj === 'object' && (
            <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
                Technical Specifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {Object.entries(specsObj).map(([key, val]) => (
                  <div key={key} className="bg-white p-2 rounded-lg border border-stone-200">
                    <span className="text-[10px] uppercase text-stone-400 block capitalize">{key}</span>
                    <span className="font-medium text-stone-700 truncate block">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Rental Banner if Deployed */}
          {asset.activeRental && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Active Deployment
                </span>
                <StatusBadge status={asset.activeRental.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-stone-600">
                <div>
                  <span className="text-stone-400 text-[10px] block">Borrower:</span>
                  <span className="font-medium">{asset.activeRental.borrower?.name}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Issued Date:</span>
                  <span>{new Date(asset.activeRental.issueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Due Date:</span>
                  <span className={asset.activeRental.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}>
                    {new Date(asset.activeRental.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contextual Action Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {asset.status === 'AVAILABLE' && role === 'BORROWER' && (
              <button
                onClick={() => setRequestModalOpen(true)}
                className="btn-primary py-2.5 px-5 text-xs font-semibold"
              >
                Submit Rental Request
              </button>
            )}

            {(role === 'STAFF' || role === 'ADMIN') && asset.status === 'APPROVED' && (
              <Link
                to="/rentals"
                className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Issue to Borrower
              </Link>
            )}

            {(role === 'STAFF' || role === 'ADMIN') && ['ISSUED', 'RETURN_INITIATED', 'OVERDUE'].includes(asset.status) && (
              <Link
                to="/inspections"
                className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Conduct Return Inspection
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Live Booking & Availability Timeline */}
      <AvailabilityTimeline asset={asset} rentals={asset.rentals || []} />

      {/* Historical Rentals & Inspections Log */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-600" />
          Equipment Checkout & Accountability History
        </h3>

        {asset.rentals && asset.rentals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="pb-3 font-semibold">Borrower</th>
                  <th className="pb-3 font-semibold">Issue Date</th>
                  <th className="pb-3 font-semibold">Due Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Pre-Condition</th>
                  <th className="pb-3 font-semibold text-right">Accountability Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {asset.rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="py-3 font-medium text-stone-700">{r.borrower?.name}</td>
                    <td className="py-3 text-stone-400">{new Date(r.issueDate).toLocaleDateString()}</td>
                    <td className="py-3 text-stone-400">{new Date(r.dueDate).toLocaleDateString()}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3"><ConditionBadge condition={r.preCondition} /></td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setComparisonRentalId(r.id)}
                        className="text-amber-600 hover:text-amber-700 font-medium text-xs flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Compare Pre vs Post
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic py-4">No rental checkout history recorded yet.</p>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <QRViewerModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          asset={asset}
        />
      )}

      {/* Side-by-Side Pre/Post Comparison Modal */}
      {comparisonRentalId && (
        <PrePostComparisonModal
          isOpen={Boolean(comparisonRentalId)}
          onClose={() => setComparisonRentalId(null)}
          rentalId={comparisonRentalId}
        />
      )}

      {/* Request Rental Modal */}
      {requestModalOpen && (
        <Modal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          title={`Request ${asset.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={requestForm.dueDate}
                  onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })}
                  className="glass-input w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Purpose of Rental</label>
              <textarea
                rows={3}
                required
                value={requestForm.purpose}
                onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                placeholder="Explain the work or project purpose..."
                className="glass-input w-full text-xs"
              />
            </div>

            {requestMsg.success && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                {requestMsg.success}
              </div>
            )}

            {requestMsg.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600">
                {requestMsg.error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="btn-secondary py-2 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requestSubmitting}
                className="btn-primary py-2 px-4 text-xs"
              >
                {requestSubmitting ? 'Checking Availability...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
