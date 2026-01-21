import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, user, requiredRole, requiredRoles, requiredPermission }) {
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the required roles (if provided as array)
  if (requiredRoles && Array.isArray(requiredRoles)) {
    if (!requiredRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  // Check if user has required role (if provided as string)
  else if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has required permission
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;