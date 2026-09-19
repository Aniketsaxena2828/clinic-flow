import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-xs tracking-wider uppercase text-slate-500 font-mono">Loading ClinicFlow Context...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center glass-panel max-w-md mx-auto mt-20">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Access Forbidden</h2>
        <p className="text-sm text-slate-400 mb-4">
          Your role ({user.role}) does not have permission to view this module.
        </p>
        <Navigate to="/dashboard" replace />;
      </div>
    );
  }

  return <Outlet />;
};
