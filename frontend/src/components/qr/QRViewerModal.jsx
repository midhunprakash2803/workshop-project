import React, { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatusBadge, ConditionBadge } from '../common/Badge';

export const QRViewerModal = ({ isOpen, onClose, asset }) => {
  const [copied, setCopied] = React.useState(false);
  const canvasRef = useRef(null);

  if (!asset) return null;

  // The QR target URL points directly to `/assets/${asset.id}`
  const targetUrl = `${window.location.origin}/assets/${asset.id}`;

  const downloadPNG = () => {
    const canvas = document.getElementById(`qr-canvas-${asset.id}`);
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `QR-${asset.assetCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset QR Identification Code" maxWidth="max-w-md">
      <div className="space-y-5 text-center">
        {/* Printable Area */}
        <div
          id="printable-qr-area"
          className="p-6 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Tag header */}
          <div className="flex items-center justify-between w-full mb-4 px-2 border-b border-stone-200 pb-3">
            <span className="text-[11px] font-bold tracking-widest text-amber-600 uppercase">RentIQ Asset Tag</span>
            <StatusBadge status={asset.status} />
          </div>

          {/* QR Code Canvas (High Quality with white container for reliable scanning) */}
          <div className="p-4 bg-white rounded-xl shadow-lg inline-block my-2">
            <QRCodeCanvas
              id={`qr-canvas-${asset.id}`}
              value={targetUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Asset Info on Label */}
          <div className="mt-3 text-center w-full px-2">
            <p className="text-sm font-bold text-stone-800 font-mono tracking-wider">{asset.assetCode}</p>
            <h4 className="text-sm font-medium text-stone-600 truncate max-w-[280px] mx-auto mt-0.5">{asset.name}</h4>
            <p className="text-xs text-stone-400 mt-1">{asset.category?.name || 'Asset'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={downloadPNG}
            className="btn-primary flex-1 py-2.5 text-xs"
          >
            <Download className="w-4 h-4" /> Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary flex-1 py-2.5 text-xs"
          >
            <Printer className="w-4 h-4" /> Print Label
          </button>
        </div>

        {/* Copy Target URL */}
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-400 truncate max-w-[260px] font-mono text-[11px]">{targetUrl}</span>
          <button
            onClick={handleCopyUrl}
            className="p-1.5 rounded hover:bg-stone-100 text-stone-600 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
