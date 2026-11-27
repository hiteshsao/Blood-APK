import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isDonorUser, canRequestBlood, homePathFor } from '../utils/userRoles';

/**
 * ProtectedRoute: checks authentication and an optional capability.
 * require="donor" needs a donor-enabled account; require="requester" needs an account that can request blood.
 * Redirects unauthenticated users to /login and others to the dashboard they can use.
 */
export default function ProtectedRoute({ children, require }) {
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

  // Capability check (unified USER accounts: donors have donorEnabled=true)
  if (require === 'donor' && !isDonorUser(user)) {
    return <Navigate to={canRequestBlood(user) ? '/recipient/dashboard' : '/'} replace />;
  }
  if (require === 'requester' && !canRequestBlood(user)) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return children;
}
