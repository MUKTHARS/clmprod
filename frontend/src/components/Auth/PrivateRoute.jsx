import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, user, requiredRole, requiredPermission }) {
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const path = window.location.pathname;
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    return children;
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    // Instead of showing access denied, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has required permission
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    // Instead of showing access denied, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;