import React, { useState, useEffect } from 'react';
import { maintenanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Wrench,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Maintenance = () => {
  const { role } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Complete Maintenance Modal
  const [completeModalRecord, setCompleteModalRecord] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    cost: '',
    description: '',
    restoredCondition: 'GOOD'
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await maintenanceAPI.getAll(params);
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (err) {
      console.error('Failed to load maintenance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [statusFilter]);

  const handleStartWork = async (id) => {
    try {
      await maintenanceAPI.update(id, { maintenanceStatus: 'IN_PROGRESS' });
      fetchMaintenance();
    } catch (err) {
      alert('Failed to update maintenance status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenCompleteModal = (record) => {
    setCompleteModalRecord(record);
    setCompleteForm({
      cost: record.cost || '',
      description: record.description || '',
      restoredCondition: 'GOOD'
    });
    setActionError('');
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setActionError('');
      const res = await maintenanceAPI.update(completeModalRecord.id, {
        maintenanceStatus: 'COMPLETED',
        cost: completeForm.cost,
        description: completeForm.description,
        restoredCondition: completeForm.restoredCondition
      });

      if (res.data.success) {
        setCompleteModalRecord(null);
        fetchMaintenance();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to complete maintenance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-600" />
            Asset Maintenance & Repair Pipeline
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Track repair work, parts costs, and restock verified equipment back to the AVAILABLE pool.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-white"
          >
            <option value="ALL">All Tickets</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs">Loading maintenance queue...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No maintenance records matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Equipment Asset</th>
                  <th className="py-3 px-4 font-semibold">Work Order Description</th>
                  <th className="py-3 px-4 font-semibold">Est. Repair Cost</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Started At</th>
                  <th className="py-3 px-4 font-semibold text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-700">
                      <Link
                        to={`/assets/${rec.asset.id}`}
                        className="font-semibold text-stone-800 hover:text-amber-700"
                      >
                        {rec.asset.name}
                      </Link>
                      <p className="text-[11px] font-mono text-stone-400">{rec.asset.assetCode}</p>
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 max-w-sm">
                      <p className="line-clamp-2">{rec.description}</p>
                      {rec.damageReport && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Linked Damage Incident #{rec.damageReport.id.slice(0, 8)}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      ${rec.cost.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        rec.maintenanceStatus === 'COMPLETED'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : rec.maintenanceStatus === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {rec.maintenanceStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {rec.startedAt ? new Date(rec.startedAt).toLocaleDateString() : 'Scheduled'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.maintenanceStatus === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStartWork(rec.id)}
                            className="btn-secondary py-1 px-2.5 text-xs"
                          >
                            Start Work
                          </button>
                        )}

                        {rec.maintenanceStatus !== 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenCompleteModal(rec)}
                            className="btn-success py-1 px-2.5 text-xs inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete & Restock</span>
                          </button>
                        )}

                        {rec.maintenanceStatus === 'COMPLETED' && (
                          <span className="text-[11px] text-green-600 font-medium">Restocked</span>
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

      {/* Complete Maintenance & Restock Modal */}
      {completeModalRecord && (
        <Modal
          isOpen={Boolean(completeModalRecord)}
          onClose={() => setCompleteModalRecord(null)}
          title={`Complete Repair & Restock: ${completeModalRecord.asset.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <p className="text-stone-400">Completing this work order will resolve linked damage tickets and restore asset status from <strong className="text-amber-600">MAINTENANCE</strong> back to <strong className="text-green-600">AVAILABLE</strong>.</p>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Restored Condition</label>
              <select
                value={completeForm.restoredCondition}
                onChange={(e) => setCompleteForm({ ...completeForm, restoredCondition: e.target.value })}
                className="glass-input w-full text-xs bg-white"
              >
                <option value="EXCELLENT">Excellent (Like New)</option>
                <option value="GOOD">Good (Fully Operational)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Final Repair / Parts Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={completeForm.cost}
                onChange={(e) => setCompleteForm({ ...completeForm, cost: e.target.value })}
                placeholder="0.00"
                className="glass-input w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Work Completion Notes</label>
              <textarea
                rows={3}
                required
                value={completeForm.description}
                onChange={(e) => setCompleteForm({ ...completeForm, description: e.target.value })}
                placeholder="Replaced damaged lens element, calibrated sensors, passed quality test..."
                className="glass-input w-full text-xs"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCompleteModalRecord(null)}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-success py-1.5 px-4 text-xs font-semibold"
              >
                {submitting ? 'Restocking...' : 'Verify & Restock Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
