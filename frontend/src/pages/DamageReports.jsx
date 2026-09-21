import React, { useState, useEffect } from 'react';
import { damageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badge';
import {
  AlertOctagon,
  Wrench,
  User,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DamageReports = () => {
  const { role } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await damageAPI.getAll(params);
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Failed to load damage reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const severityBadge = (severity) => {
    const map = {
      LOW: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200',
      HIGH: 'bg-rose-500/20 text-red-600 border-red-300 font-bold',
      CRITICAL: 'bg-rose-600/30 text-rose-200 border-rose-500 font-extrabold animate-pulse'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider border ${map[severity] || 'bg-stone-100 text-stone-600'}`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-red-600" />
            Equipment Damage Reports
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Logged damage incidents during return inspections with automated maintenance tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Incidents</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs">Loading damage reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No damage reports matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Impacted</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Damage Description</th>
                  <th className="py-3 px-4 font-semibold">Reported By</th>
                  <th className="py-3 px-4 font-semibold">Logged Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Maintenance Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-700">
                      <Link
                        to={`/assets/${rep.asset.id}`}
                        className="font-semibold text-stone-800 hover:text-amber-700"
                      >
                        {rep.asset.name}
                      </Link>
                      <p className="text-[11px] font-mono text-stone-400">{rep.asset.assetCode}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {severityBadge(rep.severity)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 max-w-sm">
                      <p className="line-clamp-2">{rep.description}</p>
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {rep.reporter?.name || 'Staff Member'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        rep.status === 'RESOLVED'
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {rep.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/maintenance"
                        className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                      >
                        <span>View Ticket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
