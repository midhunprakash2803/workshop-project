import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { assetsAPI } from '../../services/api';
import {
  QrCode,
  Bell,
  CheckCheck,
  User,
  LogOut,
  Shield,
  Briefcase,
  UserCheck,
  ExternalLink,
  ChevronDown,
  Search,
  Loader2,
  Wifi
} from 'lucide-react';
import { RoleBadge } from './Badge';

export const Navbar = ({ onOpenQRScanner }) => {
  const navigate = useNavigate();
  const { user, role, switchRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [assetSearchCode, setAssetSearchCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleQuickAssetSearch = async (e) => {
    e.preventDefault();
    const code = assetSearchCode.trim();
    if (!code) return;

    try {
      setIsSearching(true);
      const res = await assetsAPI.getByCode(code);
      if (res.data?.success && res.data?.asset) {
        setAssetSearchCode('');
        navigate(`/assets/${res.data.asset.id}`);
      } else {
        alert(`Asset with code "${code}" not found.`);
      }
    } catch {
      alert(`Asset with code "${code}" not found.`);
    } finally {
      setIsSearching(false);
    }
  };

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2ddd6',
        boxShadow: '0 1px 3px rgba(28,25,23,0.05)',
      }}
    >
      <div className="flex items-center justify-between w-full gap-4">

        {/* Left: Mobile brand / status pill */}
        <div className="flex items-center gap-3">
          {/* Mobile brand mark */}
          <div className="flex items-center gap-2 md:hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-900 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
            >
              R
            </div>
            <span className="font-bold text-sm" style={{ color: '#1c1917', letterSpacing: '-0.02em' }}>RentIQ</span>
          </div>

          {/* Live status pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>

        {/* Center: Quick Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <form onSubmit={handleQuickAssetSearch} className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
            <input
              type="text"
              value={assetSearchCode}
              onChange={(e) => setAssetSearchCode(e.target.value)}
              placeholder="Search by asset code..."
              className="glass-input pl-8 pr-8 py-1.5 text-xs"
              style={{ borderRadius: '99px', fontSize: '0.75rem' }}
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#d97706' }} />
            )}
          </form>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* QR Scan Button */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
            title="Scan Asset QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: '#faf9f7',
                border: '1.5px solid #e2ddd6',
                color: '#57534e',
              }}
              title="Switch Role"
            >
              <RoleBadge role={role} />
              <ChevronDown className="w-3 h-3" style={{ color: '#a8a29e' }} />
            </button>

            {showRoleSwitcher && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-2xl p-2 z-50 text-xs animate-fade-in"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2ddd6',
                  boxShadow: '0 8px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
                }}
              >
                <p
                  className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: '#a8a29e', borderBottom: '1px solid #e2ddd6' }}
                >
                  Switch Demo Role
                </p>

                {[
                  { r: 'ADMIN',    label: 'Eleanor Vance',   sub: 'Admin',    icon: Shield,    color: '#7c3aed', bg: '#f5f3ff' },
                  { r: 'STAFF',    label: 'Marcus Brody',    sub: 'Staff',    icon: Briefcase, color: '#2563eb', bg: '#eff6ff' },
                  { r: 'BORROWER', label: 'Alexander Hayes', sub: 'Borrower', icon: UserCheck, color: '#16a34a', bg: '#f0fdf4' },
                ].map(({ r, label, sub, icon: Icon, color, bg }) => (
                  <button
                    key={r}
                    onClick={() => { switchRole(r); setShowRoleSwitcher(false); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all"
                    style={{
                      background: role === r ? bg : 'transparent',
                      color: role === r ? color : '#57534e',
                    }}
                    onMouseEnter={e => { if (role !== r) e.currentTarget.style.background = '#faf9f7'; }}
                    onMouseLeave={e => { if (role !== r) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <div>
                      <p className="font-semibold leading-tight text-[11px]">{label}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleSwitcher(false);
              }}
              className="relative p-2 rounded-xl transition-all"
              style={{ background: '#faf9f7', border: '1.5px solid #e2ddd6', color: '#78716c' }}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-stone-900 text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#dc2626' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-3 z-50 animate-fade-in text-xs"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2ddd6',
                  boxShadow: '0 16px 48px rgba(28,25,23,0.12), 0 4px 12px rgba(28,25,23,0.06)',
                }}
              >
                <div
                  className="flex items-center justify-between pb-2 mb-2 px-1"
                  style={{ borderBottom: '1px solid #e2ddd6' }}
                >
                  <span className="font-semibold text-xs" style={{ color: '#1c1917' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                      style={{ color: '#d97706' }}
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs" style={{ color: '#a8a29e' }}>
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className="p-2.5 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: notif.isRead ? '#faf9f7' : '#fffbeb',
                          border: `1px solid ${notif.isRead ? '#e2ddd6' : '#fde68a'}`,
                          opacity: notif.isRead ? 0.7 : 1,
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[11px]" style={{ color: '#1c1917' }}>{notif.title}</p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: '#d97706' }} />
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#78716c' }}>{notif.message}</p>
                        <span className="text-[10px] mt-1 block" style={{ color: '#a8a29e' }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid #e2ddd6' }}>
            {/* Avatar */}
            <div
              className="hidden lg:flex w-8 h-8 rounded-full items-center justify-center text-stone-900 text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
            >
              {avatarInitial}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold leading-tight" style={{ color: '#1c1917' }}>{user?.name}</p>
              <p className="text-[10px]" style={{ color: '#a8a29e' }}>{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl transition-all"
              style={{
                background: '#faf9f7',
                border: '1.5px solid #e2ddd6',
                color: '#a8a29e',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fff1f2';
                e.currentTarget.style.borderColor = '#fecaca';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#faf9f7';
                e.currentTarget.style.borderColor = '#e2ddd6';
                e.currentTarget.style.color = '#a8a29e';
              }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
