import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDefaultPathByRole } from '../lib/role';
import { LoadingScreen } from '../components/LoadingScreen';

export function GuestRoute() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={getDefaultPathByRole(role)} replace />;

  return <Outlet />;
}
