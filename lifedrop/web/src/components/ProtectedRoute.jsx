import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: checks authentication and optional role (DONOR / RECIPIENT).
 * Redirects unauthenticated users to /login and unauthorized roles to their respective dashboards.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Checking authorization...
        </p>
      </div>
    );
  }

  // Not logged in -> send to login page
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role restriction check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Direct user to their own role dashboard if they are logged in with the wrong role
      if (userRole === 'DONOR') {
        return <Navigate to="/donor/dashboard" replace />;
      }
      if (userRole === 'RECIPIENT') {
        return <Navigate to="/recipient/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
