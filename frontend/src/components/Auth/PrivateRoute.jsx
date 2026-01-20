import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, user, requiredRole }) {
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: {requiredRole}</p>
          <p>Your role: {user.role}</p>
        </div>
      </div>
    );
  }

  return children;
}

export default PrivateRoute;