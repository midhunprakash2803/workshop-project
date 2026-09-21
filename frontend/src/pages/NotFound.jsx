import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="space-y-4 max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
        >
          <QrCode className="w-8 h-8" style={{ color: '#d97706' }} />
        </div>
        <h2
          className="text-3xl font-extrabold"
          style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.03em' }}
        >
          404 — Page Not Found
        </h2>
        <p className="text-sm" style={{ color: '#78716c' }}>
          The requested asset tracking route or resource does not exist or has been relocated.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-primary text-sm inline-flex items-center gap-2 py-2.5 px-5">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
