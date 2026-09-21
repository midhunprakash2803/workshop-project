import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  QrCode,
  Shield,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  User,
  Layers,
  Check,
  KeyRound,
  ChevronRight,
  ShieldCheck,
  Building2,
  HelpCircle
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, resetPassword, createAdminUser } = useAuth();

  // Mode: 'signin' | 'register'
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BORROWER');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle standard Email & Password submit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        await register(name.trim(), email.trim(), password, role);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email to receive password reset instructions.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setInfoMessage(`Password reset link sent to ${resetEmail}. Check your inbox!`);
      setTimeout(() => setShowForgotModal(false), 2500);
    } catch (err) {
      setError(err.message || 'Could not send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle One-Click Admin Initialization
  const handleInitAdmin = async () => {
    setError('');
    setInfoMessage('');
    setAdminSetupLoading(true);
    try {
      await createAdminUser('Admin@123');
      setInfoMessage('Admin account (admin@rentiq.com) verified and logged in successfully!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.message || 'Could not setup admin credentials in Firebase.');
    } finally {
      setAdminSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950 relative overflow-hidden">
      
      {/* Ambient background glowing accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Panel — Enterprise Brand Showcase */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] xl:w-[540px] flex-shrink-0 p-12 bg-gradient-to-br from-stone-900/90 via-stone-900/60 to-stone-950 border-r border-stone-800/80 backdrop-blur-xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-900/30 ring-1 ring-amber-400/30">
            <QrCode className="w-6 h-6 text-stone-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight text-white">RentIQ</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-stone-400 font-medium">QR-Based Rental & Asset Governance</p>
          </div>
        </div>

        {/* Feature Highlights Showcase */}
        <div className="space-y-8 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-Time Cloud Synchronization</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Enterprise equipment accountability made seamless.
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              Securely track rentals, conduct digital pre/post inspections with photo verification, and eliminate double-booking with live Firestore state sync.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {[
              {
                title: 'Live Firestore Real-Time Sync',
                desc: 'Instant role permissions and rental status updates across devices',
                icon: Layers
              },
              {
                title: 'High-Fidelity QR Inspections',
                desc: 'Digital check-in & photographic condition baseline verification',
                icon: QrCode
              },
              {
                title: 'Automated Overdue Audits',
                desc: 'Proactive return monitoring and automated alert workflows',
                icon: Shield
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-stone-900/50 border border-stone-800/80 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-200">{item.title}</h4>
                  <p className="text-xs text-stone-400 mt-0.5 leading-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-6 border-t border-stone-800/60">
          <span>Powered by Google Firebase</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cloud Services Active
          </span>
        </div>
      </div>

      {/* Right Panel — Interactive Sign In / Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md space-y-7">
          
          {/* Mobile Header Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-900/30">
              <QrCode className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">RentIQ</h1>
              <p className="text-xs text-stone-400">Enterprise Asset System</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-1 rounded-xl bg-stone-900 border border-stone-800 flex">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setInfoMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setInfoMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Title and subtext */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-stone-400 text-sm mt-1">
              {mode === 'signin'
                ? 'Sign in to access your assets, rentals, and analytics.'
                : 'Join RentIQ with real-time Firebase authentication.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="leading-normal">{error}</div>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="leading-normal">{infoMessage}</div>
            </div>
          )}

          {/* Google One-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 text-sm font-semibold hover:bg-stone-800 hover:border-stone-700 hover:text-white transition-all duration-200 shadow-sm disabled:opacity-50 group"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-stone-400 border-t-amber-400 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-800" />
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
              Or with email
            </span>
            <div className="flex-1 h-px bg-stone-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-300">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setResetEmail(email); setError(''); }}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selector (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BORROWER', label: 'Borrower', desc: 'Rent assets' },
                    { id: 'STAFF',    label: 'Staff',    desc: 'Inspections' },
                    { id: 'ADMIN',    label: 'Admin',    desc: 'Governance' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        role === r.id
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{r.label}</span>
                        {role === r.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-900/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to RentIQ' : 'Create RentIQ Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Setup for Administrator Credentials */}
          <div className="pt-4 border-t border-stone-900">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-900/60 border border-stone-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200">Admin Setup</div>
                  <div className="text-[11px] text-stone-500">Initialize Firebase Admin (admin@rentiq.com)</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInitAdmin}
                disabled={adminSetupLoading}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {adminSetupLoading ? 'Setting up...' : 'Setup / Login'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-stone-500 hover:text-stone-300 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-400">
              Enter your account email to receive a password reset link from Google Firebase.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-stone-400 hover:text-white rounded-lg bg-stone-800 hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 py-2 text-xs font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
