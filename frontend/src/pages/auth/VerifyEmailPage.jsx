import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Spinner } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, refreshUser } = useAuth();

  // 'verifying' | 'success' | 'error' | 'missing'
  const [status, setStatus] = useState(token ? 'verifying' : 'missing');
  const [message, setMessage] = useState('');
  const ran = useRef(false); // guard against StrictMode double-invoke

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        await authApi.verifyEmail(token);
        // If the user is logged in, refresh so the "verify" banner disappears.
        if (isAuthenticated) await refreshUser().catch(() => {});
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setMessage(getErrorMessage(error, 'This verification link is invalid or has expired.'));
      }
    })();
  }, [token, isAuthenticated, refreshUser]);

  return (
    <AuthCard title="Email verification">
      {status === 'verifying' && (
        <div className="flex flex-col items-center gap-3 py-4 text-brand-600">
          <Spinner size="lg" />
          <p className="text-sm text-slate-600">Verifying your email…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <Alert variant="success">Your email has been verified. You&apos;re all set! 🎉</Alert>
          <Link to={isAuthenticated ? '/dashboard' : '/login'}>
            <Button fullWidth size="lg">
              {isAuthenticated ? 'Go to dashboard' : 'Continue to log in'}
            </Button>
          </Link>
        </div>
      )}

      {(status === 'error' || status === 'missing') && (
        <div className="space-y-4">
          <Alert variant="error">
            {status === 'missing'
              ? 'This verification link is missing its token.'
              : message}
          </Alert>
          <p className="text-sm text-slate-600">
            You can request a new verification email from your dashboard after logging in.
          </p>
          <Link to={isAuthenticated ? '/dashboard' : '/login'}>
            <Button fullWidth variant="outline">
              {isAuthenticated ? 'Back to dashboard' : 'Back to log in'}
            </Button>
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
