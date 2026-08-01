import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';

/**
 * GuestRoute — for pages that only make sense when logged OUT (login, register,
 * forgot/reset password). If already authenticated, bounce to the dashboard
 * (or wherever the user was originally headed).
 */
export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-brand-600">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname ?? '/browse';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
