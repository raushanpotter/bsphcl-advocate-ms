import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts & Components
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import HRDashboard from './pages/hr/HRDashboard';
import LegalDashboard from './pages/legal/LegalDashboard';
import GMDashboard from './pages/gm/GMDashboard';
import AccountsDashboard from './pages/accounts/AccountsDashboard';

import AdvocateList from './pages/advocates/AdvocateList';
import AdvocateForm from './pages/advocates/AdvocateForm';
import AdvocateDetail from './pages/advocates/AdvocateDetail';

import BillList from './pages/bills/BillList';
import RegisterBill from './pages/bills/RegisterBill';
import BillDetail from './pages/bills/BillDetail';

import Reports from './pages/reports/Reports';
import Profile from './pages/profile/Profile';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    case 'HR': return <Navigate to="/hr/dashboard" replace />;
    case 'LEGAL': return <Navigate to="/legal/dashboard" replace />;
    case 'GM': return <Navigate to="/gm/dashboard" replace />;
    case 'ACCOUNTS': return <Navigate to="/accounts/dashboard" replace />;
    default: return <Navigate to="/bills" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect to Role Home */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin Dedicated Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* HR Dedicated Routes */}
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />

            {/* Legal Dedicated Routes */}
            <Route
              path="/legal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['LEGAL', 'ADMIN']}>
                  <LegalDashboard />
                </ProtectedRoute>
              }
            />

            {/* GM Dedicated Routes */}
            <Route
              path="/gm/dashboard"
              element={
                <ProtectedRoute allowedRoles={['GM', 'ADMIN']}>
                  <GMDashboard />
                </ProtectedRoute>
              }
            />

            {/* Accounts Dedicated Routes */}
            <Route
              path="/accounts/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ACCOUNTS', 'ADMIN']}>
                  <AccountsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Advocate Management Routes */}
            <Route path="/advocates" element={<AdvocateList />} />
            <Route
              path="/advocates/add"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <AdvocateForm />
                </ProtectedRoute>
              }
            />
            <Route path="/advocates/:id" element={<AdvocateDetail />} />
            <Route
              path="/advocates/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <AdvocateForm />
                </ProtectedRoute>
              }
            />

            {/* Bill Management Routes */}
            <Route path="/bills" element={<BillList />} />
            <Route
              path="/bills/register"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <RegisterBill />
                </ProtectedRoute>
              }
            />
            <Route path="/bills/:id" element={<BillDetail />} />

            {/* Reports Route */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS', 'GM']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Profile Route */}
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
