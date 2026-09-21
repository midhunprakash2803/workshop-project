import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Shield,
  Briefcase,
  UserCheck,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  WifiOff,
  RefreshCw,
  ArrowRight,
  Zap
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');

  const checkBackendHealth = async () => {
    setServerStatus('checking');
    try {
      const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      setServerStatus(res.data?.status === 'ok' ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  };

  useEffect(() => { checkBackendHealth(); }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    try {
      setLoading(true); setError('');
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    const creds = {
      ADMIN:    { email: 'admin@rentiq.com',     password: 'Admin@123' },
      STAFF:    { email: 'staff1@rentiq.com',    password: 'Staff@123' },
      BORROWER: { email: 'borrower1@rentiq.com', password: 'Borrower@123' }
    }[role];
    if (!creds) return;
    setEmail(creds.email); setPassword(creds.password);
    try {
      setLoading(true); setError('');
      await login(creds.email, creds.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: 'linear-gradient(135deg, #faf9f7 0%, #f4f2ee 50%, #ede9e3 100%)',
      }}
    >
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{
          background: 'linear-gradient(160deg, #1c1917 0%, #292524 60%, #3d3028 100%)',
          color: 'white',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 12px rgba(180,83,9,0.4)' }}
          >
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="font-bold text-lg leading-none"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}
            >
              RentIQ
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest mt-0.5" style={{ color: '#a8a29e' }}>
              Asset Tracking
            </p>
          </div>
        </div>

        {/* Center Copy */}
        <div className="space-y-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)' }}
          >
            <Zap className="w-7 h-7 text-amber-600" />
          </div>
          <div className="space-y-3">
            <h2
              className="text-3xl font-extrabold leading-tight"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}
            >
              Smarter asset<br />management
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#a8a29e' }}>
              QR-based checkout, digital accountability inspections, and automated overdue tracking — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-2">
            {[
              'QR Code checkout & returns',
              'Real-time overdue detection',
              'Digital damage inspection',
              'Multi-role access control',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-xs" style={{ color: '#d6d3d1' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px]" style={{ color: '#57534e' }}>
          © 2025 RentIQ. Built for accountability.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
            >
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <h1 className="font-bold text-lg" style={{ color: '#1c1917', letterSpacing: '-0.03em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              RentIQ
            </h1>
          </div>

          {/* Page title */}
          <div className="space-y-1">
            <h2
              className="text-2xl font-extrabold"
              style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: '#78716c' }}>
              Sign in to continue to your dashboard.
            </p>

            {/* Server status */}
            <div className="pt-1">
              {serverStatus === 'online' && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  API Online
                </span>
              )}
              {serverStatus === 'checking' && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: '#faf9f7', color: '#a8a29e', border: '1px solid #e2ddd6' }}
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Checking server...
                </span>
              )}
              {serverStatus === 'offline' && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca' }}
                >
                  <WifiOff className="w-3 h-3" />
                  Backend offline — run npm run dev
                  <button onClick={checkBackendHealth} title="Retry" className="ml-1 hover:opacity-70">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Quick Demo Buttons */}
          <div
            className="p-4 rounded-2xl space-y-3"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#92400e' }}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Demo Login
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'ADMIN',    label: 'Admin',    sub: 'Full Access',    icon: Shield,    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                { role: 'STAFF',    label: 'Staff',    sub: 'Issue & Inspect', icon: Briefcase, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                { role: 'BORROWER', label: 'Borrower', sub: 'Rent & Return',  icon: UserCheck, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
              ].map(({ role, label, sub, icon: Icon, color, bg, border }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  disabled={loading}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `1.5px solid ${border}` }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Icon className="w-4 h-4 mb-1.5" style={{ color }} />
                  <p className="text-[11px] font-bold leading-tight" style={{ color: '#1c1917' }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#a8a29e' }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div
            className="p-6 rounded-2xl space-y-4"
            style={{
              background: '#ffffff',
              border: '1px solid #e2ddd6',
              boxShadow: '0 2px 8px rgba(28,25,23,0.06), 0 8px 24px rgba(28,25,23,0.04)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#44403c' }}>Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rentiq.com"
                    className="glass-input pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#44403c' }}>Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input pl-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#a8a29e' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="p-3 rounded-xl flex items-start gap-2 text-xs"
                  style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#dc2626' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{error}</p>
                    {error.includes('Cannot connect') && (
                      <p className="text-[11px] mt-0.5 opacity-80">
                        Run <code className="bg-red-100 px-1 py-0.5 rounded font-mono">npm run dev</code> from the project root.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="pt-3 text-center text-xs" style={{ borderTop: '1px solid #e2ddd6', color: '#a8a29e' }}>
              No account?{' '}
              <Link to="/register" className="font-semibold" style={{ color: '#d97706' }}>
                Create Borrower Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
