import React, { useState, useEffect } from 'react';
import { dashboardAPI, rentalsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge, RoleBadge } from '../components/common/Badge';
import {
  Boxes,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  CalendarCheck,
  TrendingUp,
  QrCode,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Package,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = ({ onOpenQRScanner }) => {
  const { user, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOverdue, setCheckingOverdue] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getMetrics();
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleRunOverdueCron = async () => {
    try {
      setCheckingOverdue(true);
      await rentalsAPI.checkOverdue();
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to run overdue check', err);
    } finally {
      setCheckingOverdue(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: '#fde68a', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#a8a29e' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #3d3028 100%)',
          color: 'white',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d97706, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(217,119,6,0.3)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.4)' }}
              >
                Operational Dashboard
              </span>
              <RoleBadge role={role} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold leading-tight"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}
            >
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#a8a29e', maxWidth: '32rem' }}>
              QR-based asset checkout, digital accountability inspections, and automated overdue tracking are live.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQRScanner}
              className="btn-primary py-2.5 px-5 text-sm"
            >
              <QrCode className="w-4 h-4" /> Scan QR Code
            </button>
            {(role === 'ADMIN' || role === 'STAFF') && (
              <button
                onClick={handleRunOverdueCron}
                disabled={checkingOverdue}
                className="py-2.5 px-4 text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#d6d3d1',
                }}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${checkingOverdue ? 'animate-spin text-amber-600' : ''}`} />
                {checkingOverdue ? 'Evaluating...' : 'Run Overdue Check'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Assets */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a8a29e' }}>Total Assets</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f5f3ff' }}>
              <Boxes className="w-4 h-4" style={{ color: '#7c3aed' }} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {metrics.totalAssets || 0}
            </span>
            <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>{metrics.categoriesCount || 0} categories registered</p>
          </div>
          <div className="h-1 rounded-full" style={{ background: '#ede9e3' }}>
            <div className="h-1 rounded-full" style={{ background: 'linear-gradient(to right, #7c3aed, #a78bfa)', width: '70%' }} />
          </div>
        </div>

        {/* Ready to Rent */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a8a29e' }}>Available</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold" style={{ color: '#16a34a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {metrics.availableAssets || 0}
            </span>
            <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>
              {Math.round(((metrics.availableAssets || 0) / (metrics.totalAssets || 1)) * 100)}% inventory free
            </p>
          </div>
          <div className="h-1 rounded-full" style={{ background: '#ede9e3' }}>
            <div
              className="h-1 rounded-full"
              style={{
                background: 'linear-gradient(to right, #22c55e, #4ade80)',
                width: `${Math.round(((metrics.availableAssets || 0) / (metrics.totalAssets || 1)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Active Rentals */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a8a29e' }}>Active Rentals</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Clock className="w-4 h-4" style={{ color: '#1d4ed8' }} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {metrics.activeRentals || 0}
            </span>
            <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>{metrics.pendingRequests || 0} requests pending</p>
          </div>
          <div className="h-1 rounded-full" style={{ background: '#ede9e3' }}>
            <div className="h-1 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #93c5fd)', width: '55%' }} />
          </div>
        </div>

        {/* Attention Required */}
        <div
          className="card p-5 space-y-3"
          style={
            (metrics.overdueRentals > 0 || metrics.damagedAssets > 0)
              ? { borderColor: '#fecaca', background: '#fff8f8' }
              : {}
          }
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a8a29e' }}>Alerts</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fff1f2' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold" style={{ color: '#dc2626', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {metrics.overdueRentals || 0}
            </span>
            <span className="text-xs font-medium" style={{ color: '#dc2626' }}>Overdue</span>
            <span style={{ color: '#e2ddd6' }}>•</span>
            <span className="text-2xl font-bold" style={{ color: '#d97706', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {metrics.damagedAssets || 0}
            </span>
            <span className="text-xs font-medium" style={{ color: '#d97706' }}>Damaged</span>
          </div>
          <p className="text-xs" style={{ color: '#a8a29e' }}>{metrics.maintenanceCount || 0} assets in repair queue</p>
        </div>
      </div>

      {/* Overdue Warning */}
      {data?.overdueList && data.overdueList.length > 0 && (
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ background: '#fff8f8', border: '1.5px solid #fecaca' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#dc2626' }}>
              <AlertTriangle className="w-4 h-4" />
              Critical: {data.overdueList.length} Rental(s) Overdue
            </div>
            <Link to="/rentals" className="text-xs font-medium flex items-center gap-1" style={{ color: '#dc2626' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.overdueList.map((rental) => (
              <div
                key={rental.id}
                className="p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                style={{ background: '#ffffff', border: '1px solid #fecaca' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: '#1c1917' }}>{rental.asset.name}</p>
                  <p className="font-mono text-[11px] mt-0.5" style={{ color: '#a8a29e' }}>
                    {rental.asset.assetCode} · {rental.borrower.name}
                  </p>
                  <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#dc2626' }}>
                    Due {new Date(rental.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/assets/${rental.asset.id}`} className="btn-danger py-1.5 px-3 text-xs flex-shrink-0">
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: Recent Rentals + Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Rentals */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex items-center justify-between" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e2ddd6' }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Recent Deployments
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>Real-time checkouts and returns</p>
            </div>
            <Link to="/rentals" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#d97706' }}>
              All Rentals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2ddd6' }}>
                  {['Asset', 'Borrower', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} className="pb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a8a29e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.recentRentals?.map((rental) => (
                  <tr
                    key={rental.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid #f4f2ee' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf9f7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="py-3">
                      <p className="font-semibold" style={{ color: '#1c1917' }}>{rental.asset.name}</p>
                      <p className="font-mono text-[10px] mt-0.5" style={{ color: '#a8a29e' }}>{rental.asset.assetCode}</p>
                    </td>
                    <td className="py-3" style={{ color: '#57534e' }}>{rental.borrower.name}</td>
                    <td className="py-3" style={{ color: '#78716c' }}>{new Date(rental.dueDate).toLocaleDateString()}</td>
                    <td className="py-3"><StatusBadge status={rental.status} /></td>
                    <td className="py-3 text-right">
                      <Link to={`/assets/${rental.asset.id}`} className="font-semibold text-xs" style={{ color: '#d97706' }}>
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e2ddd6' }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Audit Trail
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>Accountability log</p>
            </div>
            {(role === 'ADMIN' || role === 'STAFF') && (
              <Link to="/audit" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#d97706' }}>
                View Log <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
            {data?.recentAuditLogs?.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl text-xs"
                style={{ background: '#faf9f7', border: '1px solid #e2ddd6' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold font-mono text-[10px]" style={{ color: '#1c1917' }}>{log.action}</span>
                  <span className="text-[10px]" style={{ color: '#a8a29e' }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: '#78716c' }}>
                  {log.newValue || log.oldValue || 'System event triggered'}
                </p>
                <div
                  className="flex items-center justify-between mt-1.5 pt-1.5 text-[10px]"
                  style={{ borderTop: '1px solid #e2ddd6', color: '#a8a29e' }}
                >
                  <span>By: {log.user?.name || 'System'}</span>
                  <span className="uppercase font-semibold">{log.entityType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Asset Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {data?.categoryDistribution?.map((cat, i) => {
            const colors = ['#7c3aed', '#1d4ed8', '#d97706', '#16a34a', '#dc2626'];
            const bgs = ['#f5f3ff', '#eff6ff', '#fffbeb', '#f0fdf4', '#fff1f2'];
            return (
              <div
                key={i}
                className="p-4 rounded-xl text-center transition-all card-hover"
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: colors[i % colors.length], fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {cat.count}
                </span>
                <p className="text-xs font-medium mt-1 truncate" style={{ color: '#57534e' }}>{cat.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
