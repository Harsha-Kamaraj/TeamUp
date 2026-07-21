import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';

/**
 * ProtectedRoute — gates authenticated-only routes.
 * - While the session is loading, show a spinner (avoids a login flash).
 * - If unauthenticated, redirect to /login and remember where we came from
 *   so we can return there after a successful login.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-brand-600">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
