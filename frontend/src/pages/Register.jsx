import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    try {
      setLoading(true); setError('');
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #faf9f7 0%, #f4f2ee 50%, #ede9e3 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, #fde68a, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, #fcd34d, transparent)' }} />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white mb-2"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 16px rgba(180,83,9,0.3)' }}
          >
            <QrCode className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}>
            Create Borrower Account
          </h1>
          <p className="text-xs" style={{ color: '#78716c' }}>Join RentIQ to request equipment and track return accountability</p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-7 space-y-4 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid #e2ddd6', boxShadow: '0 4px 16px rgba(28,25,23,0.07)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#44403c' }}>Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Alexander Hayes" className="glass-input pl-9 text-xs" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#44403c' }}>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com" className="glass-input pl-9 text-xs" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#44403c' }}>Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a8a29e' }} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="glass-input pl-9 text-xs" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-xs"
                style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
              {loading ? 'Creating Account...' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="pt-3 text-center text-xs" style={{ borderTop: '1px solid #e2ddd6', color: '#a8a29e' }}>
            Already registered?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#d97706' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
