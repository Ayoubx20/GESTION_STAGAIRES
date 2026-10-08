import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], allowPublic = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to initialize
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user) {
    const pageAccess = user.role === 'admin' ? 'all' : user.pageAccess || 'all';
    if (pageAccess !== 'all') {
      const allowedPath = pageAccess === 'timesheet' ? '/timesheet' : '/dashboard';
      if (location.pathname !== allowedPath) {
        return <Navigate to={allowedPath} replace />;
      }
    }
  }

  // Public routes that should bypass auth check
  const publicPaths = ['/', '/login', '/register', '/registration-pending', '/forgot-password'];
  if (publicPaths.some((path) => location.pathname === path)) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (!user && allowPublic) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children or outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;