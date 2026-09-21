import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity animate-fade-in"
        style={{ background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl text-left transition-all sm:my-8 w-full ${maxWidth} p-6 sm:p-7 animate-fade-in`}
          style={{
            background: '#ffffff',
            border: '1px solid #e2ddd6',
            boxShadow: '0 20px 60px rgba(28,25,23,0.16), 0 4px 16px rgba(28,25,23,0.08)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between pb-4 mb-4"
            style={{ borderBottom: '1px solid #e2ddd6' }}
          >
            <h3
              className="text-base font-bold flex items-center gap-2"
              style={{ color: '#1c1917', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.02em' }}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-all"
              style={{ color: '#a8a29e', background: '#faf9f7', border: '1px solid #e2ddd6' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f4f2ee'; e.currentTarget.style.color = '#57534e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf9f7'; e.currentTarget.style.color = '#a8a29e'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
