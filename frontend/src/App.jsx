import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { QRScannerModal } from './components/qr/QRScannerModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { AssetDetail } from './pages/AssetDetail';
import { RentalRequests } from './pages/RentalRequests';
import { ActiveRentals } from './pages/ActiveRentals';
import { InspectionsReturns } from './pages/InspectionsReturns';
import { DamageReports } from './pages/DamageReports';
import { Maintenance } from './pages/Maintenance';
import { AuditLogs } from './pages/AuditLogs';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';

// Protected Route Wrapper
const ProtectedLayout = ({ allowedRoles = null, children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f7' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fde68a', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#faf9f7', color: '#1c1917' }}>
      {/* Sidebar for Desktop */}
      <Sidebar onOpenQRScanner={() => setQrScannerOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenQRScanner={() => setQrScannerOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-12">
          {children}
        </main>
      </div>

      {/* Global Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
      />
    </div>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Core Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard onOpenQRScanner={() => {}} />
                </ProtectedLayout>
              }
            />

            <Route
              path="/assets"
              element={
                <ProtectedLayout>
                  <Assets onOpenQRScanner={() => {}} />
                </ProtectedLayout>
              }
            />

            {/* Direct QR Scan Target URL */}
            <Route
              path="/assets/:id"
              element={
                <ProtectedLayout>
                  <AssetDetail />
                </ProtectedLayout>
              }
            />

            <Route
              path="/requests"
              element={
                <ProtectedLayout>
                  <RentalRequests />
                </ProtectedLayout>
              }
            />

            <Route
              path="/rentals"
              element={
                <ProtectedLayout>
                  <ActiveRentals />
                </ProtectedLayout>
              }
            />

            {/* Staff & Admin Only Routes */}
            <Route
              path="/inspections"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'STAFF']}>
                  <InspectionsReturns />
                </ProtectedLayout>
              }
            />

            <Route
              path="/damage"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'STAFF']}>
                  <DamageReports />
                </ProtectedLayout>
              }
            />

            <Route
              path="/maintenance"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'STAFF']}>
                  <Maintenance />
                </ProtectedLayout>
              }
            />

            <Route
              path="/audit"
              element={
                <ProtectedLayout allowedRoles={['ADMIN', 'STAFF']}>
                  <AuditLogs />
                </ProtectedLayout>
              }
            />

            {/* 404 Catch-All */}
            <Route
              path="*"
              element={
                <ProtectedLayout>
                  <NotFound />
                </ProtectedLayout>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
