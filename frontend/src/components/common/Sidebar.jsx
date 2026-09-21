import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  CalendarDays,
  Clock,
  ClipboardCheck,
  AlertOctagon,
  Wrench,
  History,
  QrCode,
  Zap
} from 'lucide-react';

export const Sidebar = ({ onOpenQRScanner }) => {
  const { role } = useAuth();

  const links = [
    {
      label: 'Dashboard',
      to: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'STAFF', 'BORROWER']
    },
    {
      label: 'Asset Inventory',
      to: '/assets',
      icon: Boxes,
      roles: ['ADMIN', 'STAFF', 'BORROWER']
    },
    {
      label: 'Rental Requests',
      to: '/requests',
      icon: CalendarDays,
      roles: ['ADMIN', 'STAFF', 'BORROWER']
    },
    {
      label: 'Active Rentals',
      to: '/rentals',
      icon: Clock,
      roles: ['ADMIN', 'STAFF', 'BORROWER']
    },
    {
      label: 'Return Inspections',
      to: '/inspections',
      icon: ClipboardCheck,
      roles: ['ADMIN', 'STAFF']
    },
    {
      label: 'Damage Reports',
      to: '/damage',
      icon: AlertOctagon,
      roles: ['ADMIN', 'STAFF']
    },
    {
      label: 'Maintenance',
      to: '/maintenance',
      icon: Wrench,
      roles: ['ADMIN', 'STAFF']
    },
    {
      label: 'Audit Logs',
      to: '/audit',
      icon: History,
      roles: ['ADMIN', 'STAFF']
    }
  ];

  const filteredLinks = links.filter(link => link.roles.includes(role));

  return (
    <aside
      className="w-60 flex-shrink-0 min-h-screen hidden md:flex flex-col"
      style={{
        background: '#ffffff',
        borderRight: '1px solid #e2ddd6',
      }}
    >
      {/* Brand Header */}
      <div
        className="h-16 flex items-center gap-3 px-5"
        style={{ borderBottom: '1px solid #e2ddd6' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-900 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            boxShadow: '0 2px 8px rgba(180,83,9,0.28)',
          }}
        >
          <QrCode className="w-4 h-4" />
        </div>
        <div>
          <h1
            className="font-bold text-sm leading-none flex items-center gap-1.5"
            style={{ fontFamily: '"Plus Jakarta Sans", Inter, sans-serif', color: '#1c1917', letterSpacing: '-0.02em' }}
          >
            RentIQ
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
              style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
            >
              PRO
            </span>
          </h1>
          <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wider" style={{ color: '#a8a29e' }}>
            Asset Tracking
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: '#a8a29e' }}
        >
          Menu
        </p>

        {filteredLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-amber-800'
                    : 'text-stone-500 hover:text-stone-800'
                }`
              }
              style={({ isActive }) => ({
                background: isActive
                  ? 'linear-gradient(to right, #fef3c7, #fde68a20)'
                  : 'transparent',
                boxShadow: isActive ? '0 1px 3px rgba(180,83,9,0.08)' : 'none',
                borderLeft: isActive ? '2px solid #d97706' : '2px solid transparent',
              })}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* QR Scanner CTA */}
      <div className="p-3" style={{ borderTop: '1px solid #e2ddd6' }}>
        <div
          className="p-3.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
              Quick QR Scan
            </span>
          </div>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#a8a29e' }}>
            Scan physical tags to issue or return equipment instantly.
          </p>
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn-primary w-full py-2 text-xs"
          >
            Launch Scanner
          </button>
        </div>
      </div>
    </aside>
  );
};
