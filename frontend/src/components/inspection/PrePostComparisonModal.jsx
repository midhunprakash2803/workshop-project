import React, { useState, useEffect } from 'react';
import { inspectionAPI } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConditionBadge, StatusBadge } from '../common/Badge';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, UserCheck, Calendar, Camera } from 'lucide-react';

export const PrePostComparisonModal = ({ isOpen, onClose, rentalId }) => {
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && rentalId) {
      const fetchComparison = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await inspectionAPI.getComparison(rentalId);
          if (res.data.success) {
            setComparisonData(res.data.comparison);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch comparison details.');
        } finally {
          setLoading(false);
        }
      };

      fetchComparison();
    }
  }, [isOpen, rentalId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Inspection Accountability Comparison" maxWidth="max-w-4xl">
      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading inspection evidence & comparison records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      ) : comparisonData ? (
        <div className="space-y-6">
          {/* Top Asset Summary Banner */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {comparisonData.asset.imageUrl && (
                <img
                  src={comparisonData.asset.imageUrl}
                  alt={comparisonData.asset.name}
                  className="w-12 h-12 rounded-lg object-cover border border-stone-200"
                />
              )}
              <div>
                <h4 className="font-semibold text-stone-800">{comparisonData.asset.name}</h4>
                <p className="text-xs text-stone-400 font-mono">{comparisonData.asset.code} • {comparisonData.asset.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className=" px-3 py-1.5 rounded-lg border border-stone-200">
                <span className="text-stone-400">Borrower: </span>
                <span className="font-medium text-stone-700">{comparisonData.borrower?.name}</span>
              </div>
              <div className=" px-3 py-1.5 rounded-lg border border-stone-200">
                <span className="text-stone-400">Due: </span>
                <span className="font-medium text-stone-700">
                  {new Date(comparisonData.dates.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Condition Verdict Alert */}
          {comparisonData.isDamaged ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm">Damage Documented During Return Inspection</h5>
                <p className="text-xs text-red-600/80 mt-0.5">
                  The returned condition does not match pre-issue baseline. An automated damage report was generated and asset transitioned to MAINTENANCE.
                </p>
                {comparisonData.damageReport && (
                  <p className="text-xs font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 mt-2 text-rose-200">
                    Severity: {comparisonData.damageReport.severity} • {comparisonData.damageReport.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-sm">Accountability Cleared</p>
                <p className="text-green-700/80">Returned in acceptable condition with no reportable structural or electronic damage.</p>
              </div>
            </div>
          )}

          {/* Side-By-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Pre-Issue Condition Baseline */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold">Stage 1: Pre-Issue</span>
                  <h4 className="font-semibold text-stone-700 text-sm">Issue Baseline Condition</h4>
                </div>
                <ConditionBadge condition={comparisonData.preIssue.condition} />
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Staff Pre-Inspection Notes:</label>
                <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 min-h-[54px]">
                  {comparisonData.preIssue.notes}
                </p>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Baseline Photographic Evidence:
                </label>
                {comparisonData.preIssue.photos && comparisonData.preIssue.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {comparisonData.preIssue.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block group overflow-hidden rounded-xl border border-stone-200 bg-stone-50 aspect-video relative"
                      >
                        <img
                          src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                          alt={`Pre-issue evidence ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    No baseline photos captured prior to issue.
                  </p>
                )}
              </div>

              <div className="pt-2 text-[11px] text-stone-400 border-t border-stone-200 flex items-center justify-between">
                <span>Verified by: {comparisonData.preIssue.inspector?.name || 'Staff'}</span>
                <span>{new Date(comparisonData.dates.issueDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Right: Post-Return Condition Evidence */}
            <div className={`p-5 rounded-2xl bg-white border space-y-4 ${
              comparisonData.isDamaged ? 'border-red-300 shadow-lg shadow-rose-500/5' : 'border-stone-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold">Stage 2: Post-Return</span>
                  <h4 className="font-semibold text-stone-700 text-sm">Return Digital Inspection</h4>
                </div>
                {comparisonData.postReturn ? (
                  <ConditionBadge condition={comparisonData.postReturn.condition} />
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Pending Inspection
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Return Inspector Remarks:</label>
                <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 min-h-[54px]">
                  {comparisonData.postReturn?.remarks || 'Awaiting return inspection check-in by Staff member.'}
                </p>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Return Condition Photos:
                </label>
                {comparisonData.postReturn?.photos && comparisonData.postReturn.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {comparisonData.postReturn.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block group overflow-hidden rounded-xl border border-stone-200 bg-stone-50 aspect-video relative"
                      >
                        <img
                          src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                          alt={`Post-return evidence ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {comparisonData.postReturn ? 'No photos attached to return inspection.' : 'Return inspection not yet performed.'}
                  </p>
                )}
              </div>

              <div className="pt-2 text-[11px] text-stone-400 border-t border-stone-200 flex items-center justify-between">
                <span>Inspected by: {comparisonData.postReturn?.inspector?.name || 'Awaiting Staff'}</span>
                <span>{comparisonData.postReturn?.inspectedAt ? new Date(comparisonData.postReturn.inspectedAt).toLocaleDateString() : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
