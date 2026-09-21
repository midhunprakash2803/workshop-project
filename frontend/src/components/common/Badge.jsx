import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const configs = {
    AVAILABLE: {
      label: 'Available',
      bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#22c55e'
    },
    REQUESTED: {
      label: 'Requested',
      bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b'
    },
    APPROVED: {
      label: 'Approved',
      bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6'
    },
    ISSUED: {
      label: 'Issued',
      bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6'
    },
    ACTIVE: {
      label: 'Active',
      bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', dot: '#8b5cf6'
    },
    OVERDUE: {
      label: 'Overdue!',
      bg: '#fff1f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444',
      pulse: true
    },
    RETURN_INITIATED: {
      label: 'Return Initiated',
      bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc', dot: '#06b6d4'
    },
    INSPECTION: {
      label: 'Inspecting',
      bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff', dot: '#a855f7'
    },
    VERIFIED: {
      label: 'Verified',
      bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', dot: '#14b8a6'
    },
    DAMAGED: {
      label: 'Damaged',
      bg: '#fff1f2', color: '#be123c', border: '#fecdd3', dot: '#f43f5e'
    },
    MAINTENANCE: {
      label: 'Maintenance',
      bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', dot: '#fb923c'
    },
    COMPLETED: {
      label: 'Completed',
      bg: '#faf9f7', color: '#57534e', border: '#e2ddd6', dot: '#a8a29e'
    },
    PENDING: {
      label: 'Pending',
      bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b'
    },
    REJECTED: {
      label: 'Rejected',
      bg: '#fff1f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444'
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: '#faf9f7', color: '#78716c', border: '#e2ddd6', dot: '#a8a29e'
    }
  };

  const c = configs[status] || {
    label: status || 'Unknown',
    bg: '#faf9f7', color: '#78716c', border: '#e2ddd6', dot: '#a8a29e'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.pulse ? 'animate-pulse' : ''} ${className}`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
};

export const ConditionBadge = ({ condition, className = '' }) => {
  const configs = {
    EXCELLENT: { label: 'Excellent', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    GOOD:      { label: 'Good',      bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    FAIR:      { label: 'Fair',      bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    DAMAGED:   { label: 'Damaged',   bg: '#fff1f2', color: '#dc2626', border: '#fecaca' },
  };

  const c = configs[condition] || {
    label: condition || 'Unknown',
    bg: '#faf9f7', color: '#78716c', border: '#e2ddd6'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${className}`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const configs = {
    ADMIN:    { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
    STAFF:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    BORROWER: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  };

  const c = configs[role] || { bg: '#faf9f7', color: '#57534e', border: '#e2ddd6' };

  return (
    <span
      className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {role}
    </span>
  );
};
