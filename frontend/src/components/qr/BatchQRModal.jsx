import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, CheckSquare, Square, Layers, Sparkles } from 'lucide-react';

export const BatchQRModal = ({ isOpen, onClose, assets = [] }) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set(assets.map(a => a.id)));
  const printAreaRef = useRef(null);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map(a => a.id)));
    }
  };

  const selectedAssets = assets.filter(a => selectedIds.has(a.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Screen container */}
      <div className=" border border-stone-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:bg-white print:border-none print:shadow-none print:max-w-none print:max-h-none print:static">
        
        {/* Modal Header (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                Batch QR Asset Tag Generator
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {selectedAssets.length} of {assets.length} Selected
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Generate high-density asset barcode stickers ready for printer or PDF export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs text-stone-600 font-medium transition-colors flex items-center gap-1.5"
            >
              {selectedIds.size === assets.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{selectedIds.size === assets.length ? 'Deselect All' : 'Select All'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedAssets.length === 0}
              className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Asset Tags</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Label Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50 print:p-0 print:bg-white" ref={printAreaRef}>
          {selectedAssets.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-sm">No assets selected. Select at least one asset to preview tags.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
              {selectedAssets.map((asset) => {
                const isSelected = selectedIds.has(asset.id);
                const assetUrl = `${window.location.origin}/assets/${asset.id}`;

                return (
                  <div
                    key={asset.id}
                    onClick={() => toggleSelect(asset.id)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none bg-white text-stone-800 shadow-sm print:shadow-none print:border-stone-200 print:rounded-lg ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-500/20'
                        : 'border-stone-200 opacity-60'
                    }`}
                  >
                    {/* Checkbox indicator (Screen only) */}
                    <div className="absolute top-2 right-2 print:hidden">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* High-Contrast Crisp QR Code for Scanners */}
                      <div className="p-1.5 bg-white border border-stone-200 rounded-lg shadow-sm flex-shrink-0">
                        <QRCodeSVG
                          value={assetUrl}
                          size={76}
                          level="M"
                          includeMargin={false}
                        />
                      </div>

                      {/* Tag metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="inline-block px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono font-bold text-stone-600 tracking-wider">
                          {asset.assetCode}
                        </div>
                        <h4 className="text-xs font-bold text-stone-800 truncate mt-1" title={asset.name}>
                          {asset.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 truncate">
                          {asset.category?.name || 'General Equipment'}
                        </p>
                        {asset.serialNumber && (
                          <p className="text-[9px] font-mono text-stone-400 truncate mt-0.5">
                            SN: {asset.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tag Footer */}
                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400">
                      <span>RentIQ Verified Tag</span>
                      <span className="font-mono">STATUS: {asset.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer info (Hidden on print) */}
        <div className="p-3.5 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-400 print:hidden">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Standard tag dimension: 2.5" x 1.5" adhesive label compatible.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
