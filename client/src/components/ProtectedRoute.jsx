import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home dashboard
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'HR':
        return <Navigate to="/hr/dashboard" replace />;
      case 'LEGAL':
        return <Navigate to="/legal/dashboard" replace />;
      case 'GM':
        return <Navigate to="/gm/dashboard" replace />;
      case 'ACCOUNTS':
        return <Navigate to="/accounts/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}
