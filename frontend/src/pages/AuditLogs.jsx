import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/common/Badge';
import { exportToCSV } from '../utils/exportUtils';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  ArrowRight,
  Database,
  Download
} from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (search) params.search = search;
      if (selectedEntity !== 'ALL') params.entityType = selectedEntity;

      const res = await auditAPI.getAll(params);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportLogs = () => {
    exportToCSV(logs, 'rentiq-audit-trail', [
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'action', label: 'Action' },
      { key: 'entityType', label: 'Entity Type' },
      { key: 'entityId', label: 'Entity ID' },
      { key: 'user.name', label: 'Triggered By' },
      { key: 'user.email', label: 'User Email' },
      { key: 'oldValue', label: 'Old Value' },
      { key: 'newValue', label: 'New Value' },
      { key: 'ipAddress', label: 'IP Address' }
    ]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-600" />
            System Audit Trail & Accountability Logs
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Cryptographically recorded timeline of all state transitions, user checkouts, inspections, and maintenance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportLogs}
          className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto"
          title="Download compliance audit trail in CSV format"
        >
          <Download className="w-4 h-4 text-green-600" /> Export Audit CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit action, before/after values, or user..."
              className="glass-input w-full pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="glass-input text-xs py-2 bg-white"
            >
              <option value="ALL">All Entity Types</option>
              <option value="ASSET">Assets</option>
              <option value="RENTAL">Rentals</option>
              <option value="RENTAL_REQUEST">Requests</option>
              <option value="DAMAGE_REPORT">Damage Reports</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="USER">Users</option>
            </select>

            <button type="submit" className="btn-secondary py-2 px-3.5 text-xs">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Audit Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            No audit logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action Triggered</th>
                  <th className="py-3 px-4 font-semibold">Entity</th>
                  <th className="py-3 px-4 font-semibold">Actor / User</th>
                  <th className="py-3 px-4 font-semibold">Before ➔ After Transition</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-stone-700">
                      <span className="px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-600">
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name}</p>
                          <span className="text-[10px] text-stone-400 uppercase">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">System / Cron</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs text-[11px]">
                      {log.oldValue && log.newValue ? (
                        <div className="space-y-0.5">
                          <p className="text-red-600 truncate"><span className="text-stone-400">From:</span> {log.oldValue}</p>
                          <p className="text-green-600 truncate"><span className="text-stone-400">To:</span> {log.newValue}</p>
                        </div>
                      ) : (
                        <p className="text-stone-600 truncate">{log.newValue || log.oldValue || '—'}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-stone-400 font-mono text-[10px]">
                      {log.ipAddress || 'Internal'}
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
