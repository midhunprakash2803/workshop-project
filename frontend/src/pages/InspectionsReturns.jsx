import React, { useState, useEffect } from 'react';
import { rentalsAPI, inspectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PrePostComparisonModal } from '../components/inspection/PrePostComparisonModal';
import {
  ClipboardCheck,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InspectionsReturns = () => {
  const { role, user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return Inspection Modal State
  const [inspectModalRental, setInspectModalRental] = useState(null);
  const [inspectForm, setInspectForm] = useState({
    condition: 'EXCELLENT',
    remarks: '',
    photoUrls: [],
    damageDescription: '',
    damageSeverity: 'MEDIUM'
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [inspectSubmitting, setInspectSubmitting] = useState(false);
  const [inspectError, setInspectError] = useState('');
  const [inspectSuccess, setInspectSuccess] = useState('');

  // Side-by-side comparison modal state
  const [comparisonRentalId, setComparisonRentalId] = useState(null);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await rentalsAPI.getAll();
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
  }, []);

  const handleOpenInspectModal = (rental) => {
    setInspectModalRental(rental);
    setInspectForm({
      condition: 'EXCELLENT',
      remarks: '',
      photoUrls: [],
      damageDescription: '',
      damageSeverity: 'MEDIUM'
    });
    setInspectError('');
    setInspectSuccess('');
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));

      const res = await inspectionAPI.uploadPhotos(formData);
      if (res.data.success) {
        setInspectForm(prev => ({
          ...prev,
          photoUrls: [...prev.photoUrls, ...res.data.photoUrls]
        }));
      }
    } catch (err) {
      alert('Photo upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!inspectForm.condition) {
      setInspectError('Please select post-return condition.');
      return;
    }

    try {
      setInspectSubmitting(true);
      setInspectError('');
      const res = await inspectionAPI.submitInspection({
        rentalId: inspectModalRental.id,
        ...inspectForm
      });

      if (res.data.success) {
        setInspectSuccess(res.data.message);
        setTimeout(() => {
          setInspectModalRental(null);
          setInspectSuccess('');
          fetchRentals();
        }, 1500);
      }
    } catch (err) {
      setInspectError(err.response?.data?.message || 'Failed to submit inspection.');
    } finally {
      setInspectSubmitting(false);
    }
  };

  // Filter rentals needing inspection vs completed inspections
  const pendingInspections = rentals.filter(r =>
    ['RETURN_INITIATED', 'OVERDUE', 'ACTIVE'].includes(r.status)
  );

  const completedInspections = rentals.filter(r =>
    r.status === 'COMPLETED' || (r.conditions && r.conditions.length > 0)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <ClipboardCheck className="w-6 h-6 text-amber-600" />
          Digital Return Inspection & Accountability
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Perform digital check-in inspections, compare post-return evidence with pre-issue baselines, and trigger damage routing.
        </p>
      </div>

      {/* Section 1: Awaiting Return Inspection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Awaiting Digital Return Inspection ({pendingInspections.length})
          </h3>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs">Loading items...</div>
          ) : pendingInspections.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              No equipment currently awaiting return inspection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Equipment Asset</th>
                    <th className="py-3 px-4 font-semibold">Borrower</th>
                    <th className="py-3 px-4 font-semibold">Issue Condition</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold">Current State</th>
                    <th className="py-3 px-4 font-semibold text-right">Inspect Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pendingInspections.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-stone-800">{r.asset.name}</p>
                        <p className="text-[11px] font-mono text-stone-400">{r.asset.assetCode}</p>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">{r.borrower?.name}</td>
                      <td className="py-3.5 px-4"><ConditionBadge condition={r.preCondition} /></td>
                      <td className="py-3.5 px-4">{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenInspectModal(r)}
                          className="btn-primary py-1.5 px-3 text-xs font-semibold"
                        >
                          Conduct Inspection
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Inspected Returns & Comparison Archive */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Completed Inspections & Side-by-Side Archive ({completedInspections.length})
        </h3>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset</th>
                  <th className="py-3 px-4 font-semibold">Borrower</th>
                  <th className="py-3 px-4 font-semibold">Pre-Issue Condition</th>
                  <th className="py-3 px-4 font-semibold">Post-Return Condition</th>
                  <th className="py-3 px-4 font-semibold">Returned Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Accountability Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {completedInspections.map((r) => {
                  const lastCondition = r.conditions?.[0];
                  return (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        <p className="font-semibold text-stone-800">{r.asset.name}</p>
                        <p className="text-[11px] font-mono text-stone-400">{r.asset.assetCode}</p>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">{r.borrower?.name}</td>
                      <td className="py-3.5 px-4"><ConditionBadge condition={r.preCondition} /></td>
                      <td className="py-3.5 px-4">
                        {lastCondition ? (
                          <ConditionBadge condition={lastCondition.condition} />
                        ) : (
                          <span className="text-stone-400">Not recorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-400">
                        {r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setComparisonRentalId(r.id)}
                          className="btn-secondary py-1 px-3 text-xs inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Side-by-Side</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conduct Return Inspection Modal */}
      {inspectModalRental && (
        <Modal
          isOpen={Boolean(inspectModalRental)}
          onClose={() => setInspectModalRental(null)}
          title={`Return Inspection: ${inspectModalRental.asset.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
            {/* Pre-Issue Baseline Context Banner */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Pre-Issue Condition</span>
                <div className="mt-1 flex items-center gap-2">
                  <ConditionBadge condition={inspectModalRental.preCondition} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Pre-Issue Notes</span>
                <p className="text-xs text-stone-600 mt-1 truncate">
                  {inspectModalRental.preNotes || 'No special notes recorded at checkout.'}
                </p>
              </div>
            </div>

            {/* Post-Return Condition Selection */}
            <div>
              <label className="block text-stone-600 font-medium mb-1.5">
                Observed Post-Return Condition *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setInspectForm({ ...inspectForm, condition: cond })}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      inspectForm.condition === cond
                        ? cond === 'DAMAGED'
                          ? 'bg-rose-600 text-stone-900 border-rose-500 shadow-md shadow-rose-600/30 font-bold'
                          : 'bg-amber-600 text-stone-900 border-amber-400 shadow-md shadow-amber-600/20'
                        : ' border-stone-200 text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Return Remarks */}
            <div>
              <label className="block text-stone-600 font-medium mb-1">
                Return Inspection Remarks & Observations
              </label>
              <textarea
                rows={2}
                value={inspectForm.remarks}
                onChange={(e) => setInspectForm({ ...inspectForm, remarks: e.target.value })}
                placeholder="Physical appearance, functionality test, battery level, accessories accounted for..."
                className="glass-input w-full text-xs"
              />
            </div>

            {/* Photo Evidence Upload */}
            <div>
              <label className="block text-stone-600 font-medium mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                Attach Photographic Evidence (Damages, scratches, or condition proof)
              </label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary py-2 px-3 text-xs cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhotos ? 'Uploading...' : 'Choose Photos'}</span>
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
                  {inspectForm.photoUrls.length} photo(s) uploaded
                </span>
              </div>

              {inspectForm.photoUrls.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                  {inspectForm.photoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                      alt="Inspection evidence"
                      className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* If Damaged: Prompt for Severity and Damage Description */}
            {inspectForm.condition === 'DAMAGED' && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-red-300 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-red-600 font-semibold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Automated Damage Report Trigger</span>
                </div>
                <p className="text-[11px] text-red-600/80">
                  Marking as DAMAGED will instantly generate a formal damage incident ticket and transition this asset to MAINTENANCE queue.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Damage Severity</label>
                    <select
                      value={inspectForm.damageSeverity}
                      onChange={(e) => setInspectForm({ ...inspectForm, damageSeverity: e.target.value })}
                      className="glass-input w-full text-xs bg-white"
                    >
                      <option value="LOW">Low (Cosmetic, minor scratch)</option>
                      <option value="MEDIUM">Medium (Component replacement required)</option>
                      <option value="HIGH">High (Non-functional, structural break)</option>
                      <option value="CRITICAL">Critical (Total loss / hazardous)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Specific Defect</label>
                    <input
                      type="text"
                      required={inspectForm.condition === 'DAMAGED'}
                      value={inspectForm.damageDescription}
                      onChange={(e) => setInspectForm({ ...inspectForm, damageDescription: e.target.value })}
                      placeholder="e.g. Cracked display, burnt motor..."
                      className="glass-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {inspectSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                {inspectSuccess}
              </div>
            )}

            {inspectError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600">
                {inspectError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setInspectModalRental(null)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inspectSubmitting}
                className={`btn-primary py-2 px-4 text-xs font-semibold ${
                  inspectForm.condition === 'DAMAGED' ? 'bg-rose-600 hover:bg-rose-500 border-rose-500' : ''
                }`}
              >
                {inspectSubmitting ? 'Verifying & Saving...' : 'Complete Digital Inspection'}
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
