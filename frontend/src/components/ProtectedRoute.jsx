import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des rôles si spécifiés
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Rediriger vers dashboard si pas les droits
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;