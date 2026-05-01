import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', width: '100vw' }}>
        <Loader2 size={40} className="spinner text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile || !profile.role) {
    // Needs role selection
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Unauthorized role
    return <Navigate to={profile.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
