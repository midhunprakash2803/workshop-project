import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, Upload, Keyboard, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { assetsAPI } from '../../services/api';

export const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const navigate = useNavigate();
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera', 'upload', 'manual'
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const scannerRef = useRef(null);

  const processScannedText = async (decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      // If it's a full URL like http://localhost:5173/assets/ast-01 or /assets/ast-01
      let lookupKey = decodedText.trim();
      if (lookupKey.includes('/assets/')) {
        const parts = lookupKey.split('/assets/');
        lookupKey = parts[parts.length - 1].replace(/[^a-zA-Z0-9_-]/g, '');
      }

      // Check if valid asset in DB
      const res = await assetsAPI.getByCode(lookupKey);
      if (res.data.success && res.data.asset) {
        setScannedResult(res.data.asset);
        if (onScanSuccess) {
          onScanSuccess(res.data.asset);
        }
        setTimeout(() => {
          onClose();
          navigate(`/assets/${res.data.asset.id}`);
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || `No asset found matching: "${decodedText}"`);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || scannerMode !== 'camera') {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current.clear();
          scannerRef.current = null;
        });
      }
      return;
    }

    const html5QrCode = new Html5Qrcode('qr-reader-viewport');
    scannerRef.current = html5QrCode;

    const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText) => {
          // Pause camera and process
          html5QrCode.pause();
          processScannedText(decodedText);
        },
        () => {
          // Ignored parse failures during search
        }
      )
      .catch((err) => {
        console.warn('Camera access error:', err);
        setError('Camera access denied or no camera device found. You can enter the asset code manually or upload a QR image.');
        setScannerMode('manual');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, scannerMode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-temp-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      processScannedText(decodedText);
    } catch (err) {
      setError('Could not detect a valid QR code in the uploaded image.');
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processScannedText(manualCode.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Asset QR Code" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Mode Selector */}
        <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setError(''); setScannerMode('camera'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              scannerMode === 'camera'
                ? 'bg-amber-600 text-stone-900 shadow'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Camera className="w-4 h-4" /> Live Camera
          </button>
          <button
            type="button"
            onClick={() => { setError(''); setScannerMode('upload'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              scannerMode === 'upload'
                ? 'bg-amber-600 text-stone-900 shadow'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
          <button
            type="button"
            onClick={() => { setError(''); setScannerMode('manual'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              scannerMode === 'manual'
                ? 'bg-amber-600 text-stone-900 shadow'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual Code
          </button>
        </div>

        {/* Camera Viewport */}
        {scannerMode === 'camera' && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-amber-300 bg-black min-h-[280px] flex items-center justify-center">
            <div id="qr-reader-viewport" className="w-full h-full min-h-[280px]" />
            <div className="absolute inset-0 pointer-events-none border-[3px] border-amber-400/50 m-12 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Upload Mode */}
        {scannerMode === 'upload' && (
          <div className="p-8 border-2 border-dashed border-stone-300 hover:border-amber-400/70 rounded-2xl text-center bg-stone-50/50 transition-colors">
            <Upload className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="text-sm text-stone-600 font-medium mb-1">Select an image with QR Code</p>
            <p className="text-xs text-stone-400 mb-4">Supports PNG, JPG, WebP</p>
            <label className="btn-primary cursor-pointer text-xs">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <div id="qr-reader-temp-file" className="hidden" />
          </div>
        )}

        {/* Manual Input Mode */}
        {scannerMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Asset Code / QR Token / ID
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. AST-COMP-001 or AST-AV-001"
                className="glass-input w-full font-mono text-sm uppercase"
                autoFocus
              />
            </div>
            <div className="text-xs text-stone-400 flex items-center justify-between">
              <span>Try: AST-COMP-001, AST-AV-001, AST-DRN-001</span>
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="btn-primary w-full py-2.5 text-sm"
            >
              {isProcessing ? 'Searching Asset...' : 'Lookup Asset'}
            </button>
          </form>
        )}

        {/* Success Alert */}
        {scannedResult && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">Asset Located!</p>
              <p className="text-green-600">{scannedResult.name} ({scannedResult.assetCode})</p>
              <p className="text-[10px] text-emerald-500/80">Redirecting to asset details...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
