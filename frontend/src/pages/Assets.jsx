import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assetsAPI, categoriesAPI, requestsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { QRViewerModal } from '../components/qr/QRViewerModal';
import { BatchQRModal } from '../components/qr/BatchQRModal';
import { exportToCSV } from '../utils/exportUtils';
import { Modal } from '../components/common/Modal';
import {
  Search,
  Filter,
  QrCode,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Cpu,
  CheckCircle,
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';

export const Assets = ({ onOpenQRScanner }) => {
  const { role, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  // Modals state
  const [selectedQRAsset, setSelectedQRAsset] = useState(null);
  const [requestModalAsset, setRequestModalAsset] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [batchQRModalOpen, setBatchQRModalOpen] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(assets, 'rentiq-asset-inventory', [
      { key: 'assetCode', label: 'Asset Code' },
      { key: 'name', label: 'Asset Name' },
      { key: 'category.name', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'currentCondition', label: 'Condition' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'description', label: 'Description' }
    ]);
  };

  // Rental Request Form State
  const [requestForm, setRequestForm] = useState({
    startDate: '',
    dueDate: '',
    purpose: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Create Asset Form State (Admin)
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    categoryId: '',
    assetCode: '',
    description: '',
    specifications: '',
    currentCondition: 'EXCELLENT',
    imageUrl: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'ALL') params.categoryId = selectedCategory;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedCondition !== 'ALL') params.condition = selectedCondition;

      const [assetsRes, catRes] = await Promise.all([
        assetsAPI.getAll(params),
        categoriesAPI.getAll()
      ]);

      if (assetsRes.data.success) setAssets(assetsRes.data.assets);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, selectedStatus, selectedCondition]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  // Submit Rental Request (Borrower)
  const handleRentalRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.startDate || !requestForm.dueDate || !requestForm.purpose.trim()) {
      setRequestError('Please fill in start date, due date, and purpose.');
      return;
    }

    try {
      setRequestSubmitting(true);
      setRequestError('');
      const res = await requestsAPI.create({
        assetId: requestModalAsset.id,
        startDate: requestForm.startDate,
        dueDate: requestForm.dueDate,
        purpose: requestForm.purpose
      });

      if (res.data.success) {
        setRequestSuccess('Rental request submitted successfully! Awaiting Admin approval.');
        setTimeout(() => {
          setRequestModalAsset(null);
          setRequestSuccess('');
          setRequestForm({ startDate: '', dueDate: '', purpose: '' });
          fetchAssets();
        }, 1500);
      }
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to submit rental request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Submit Create Asset (Admin)
  const handleCreateAssetSubmit = async (e) => {
    e.preventDefault();
    if (!newAssetForm.name.trim() || !newAssetForm.categoryId) {
      setCreateError('Asset name and category are required.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError('');
      const res = await assetsAPI.create({
        ...newAssetForm,
        assetCode: newAssetForm.assetCode.trim() || undefined
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        setNewAssetForm({
          name: '',
          categoryId: '',
          assetCode: '',
          description: '',
          specifications: '',
          currentCondition: 'EXCELLENT',
          imageUrl: ''
        });
        fetchAssets();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create asset.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-600" />
            Asset Catalog & QR Inventory
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Track equipment lifecycle, generate QR codes, and manage checkout availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-amber-600" /> Scan QR
          </button>

          <button
            type="button"
            onClick={() => setBatchQRModalOpen(true)}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Generate printable sheet of QR code tags"
          >
            <Printer className="w-4 h-4 text-blue-600" /> Print QR Tags
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            title="Download CSV report of current assets"
          >
            <Download className="w-4 h-4 text-green-600" /> Export CSV
          </button>

          {role === 'ADMIN' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset name, code (AST-...), or specifications..."
              className="glass-input w-full pl-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input text-xs py-2 bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="glass-input text-xs py-2 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="ISSUED">Issued (Active)</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RETURN_INITIATED">Return Initiated</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            {/* Condition Select */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="glass-input text-xs py-2 bg-white"
            >
              <option value="ALL">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
            </select>

            <button type="submit" className="btn-secondary py-2 px-3 text-xs">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Asset Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching asset catalog...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card p-12 text-center text-stone-400 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-stone-400" />
          <p className="text-sm font-medium text-stone-600">No assets match your filter criteria.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('ALL'); setSelectedStatus('ALL'); setSelectedCondition('ALL'); }}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="glass-card-hover flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Asset Image Header */}
                <div className="relative h-44 bg-stone-50 overflow-hidden">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-600 bg-stone-50">
                      <Cpu className="w-12 h-12" />
                    </div>
                  )}

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <StatusBadge status={asset.status} />
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <ConditionBadge condition={asset.currentCondition} />
                  </div>

                  {/* Asset Code Tag on Image Bottom */}
                  <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-white backdrop-blur-md border border-stone-200 text-[11px] font-mono text-stone-700">
                    {asset.assetCode}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{asset.category?.name || 'General'}</span>
                  </div>

                  <h3 className="font-semibold text-stone-800 text-sm leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {asset.name}
                  </h3>

                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {asset.description || 'No description provided.'}
                  </p>

                  {/* Active Rental Info if Borrowed */}
                  {asset.activeRental && (
                    <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
                      <span>Borrower: <strong className="text-stone-800">{asset.activeRental.borrower?.name}</strong></span>
                      <span className="text-blue-600">Due {new Date(asset.activeRental.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-stone-200 mt-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedQRAsset(asset)}
                  className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5 text-xs"
                  title="View & Download QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>QR Tag</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Contextual Action based on Status & Role */}
                  {asset.status === 'AVAILABLE' && role === 'BORROWER' && (
                    <button
                      onClick={() => setRequestModalAsset(asset)}
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      Request Rental
                    </button>
                  )}

                  <Link
                    to={`/assets/${asset.id}`}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors text-xs flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {selectedQRAsset && (
        <QRViewerModal
          isOpen={Boolean(selectedQRAsset)}
          onClose={() => setSelectedQRAsset(null)}
          asset={selectedQRAsset}
        />
      )}

      {/* Borrower Rental Request Modal */}
      {requestModalAsset && (
        <Modal
          isOpen={Boolean(requestModalAsset)}
          onClose={() => setRequestModalAsset(null)}
          title={`Request Rental: ${requestModalAsset.name}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleRentalRequestSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-700">{requestModalAsset.name}</p>
                <p className="text-[11px] text-stone-400 font-mono">{requestModalAsset.assetCode}</p>
              </div>
              <ConditionBadge condition={requestModalAsset.currentCondition} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                  className="glass-input w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={requestForm.dueDate}
                  onChange={(e) => setRequestForm({ ...requestForm, dueDate: e.target.value })}
                  className="glass-input w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Purpose of Rental / Project</label>
              <textarea
                rows={3}
                required
                value={requestForm.purpose}
                onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                placeholder="Explain what project or site this equipment is needed for..."
                className="glass-input w-full text-xs"
              />
            </div>

            {requestSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{requestSuccess}</span>
              </div>
            )}

            {requestError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{requestError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRequestModalAsset(null)}
                className="btn-secondary py-2 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requestSubmitting}
                className="btn-primary py-2 px-4 text-xs"
              >
                {requestSubmitting ? 'Checking Availability...' : 'Confirm Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Add New Asset Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Register New Asset into System"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateAssetSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-stone-600 font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  placeholder="e.g. Sony FX3 Full-Frame Cinema Camera"
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Category</label>
                <select
                  required
                  value={newAssetForm.categoryId}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, categoryId: e.target.value })}
                  className="glass-input w-full text-xs bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Custom Code (Optional)</label>
                <input
                  type="text"
                  value={newAssetForm.assetCode}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, assetCode: e.target.value })}
                  placeholder="Auto-generated if blank"
                  className="glass-input w-full text-xs font-mono uppercase"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-stone-600 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newAssetForm.description}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, description: e.target.value })}
                  placeholder="Asset description and package inclusions..."
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-stone-600 font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  value={newAssetForm.imageUrl}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Initial Condition</label>
                <select
                  value={newAssetForm.currentCondition}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, currentCondition: e.target.value })}
                  className="glass-input w-full text-xs bg-white"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="btn-secondary py-2 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="btn-primary py-2 px-4 text-xs"
              >
                {createSubmitting ? 'Registering...' : 'Register Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Batch QR Printable Tags Sheet Modal */}
      <BatchQRModal
        isOpen={batchQRModalOpen}
        onClose={() => setBatchQRModalOpen(false)}
        assets={assets}
      />
    </div>
  );
};
