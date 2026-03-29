import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole, getDefaultPathByRole } from '../lib/role';
import { LoadingScreen } from '../components/LoadingScreen';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0) {
    const normalized = normalizeRole(role);
    if (!allowedRoles.includes(normalized)) {
      return <Navigate to={getDefaultPathByRole(normalized)} replace />;
    }
  }

  return <Outlet />;
}
