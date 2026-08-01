import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Spinner } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

/**
 * Handles two entry points:
 *   1. Clicking the emailed link (?token=…) — verifies immediately.
 *   2. Arriving with no token, e.g. from a "Verify my email" prompt after an
 *      action was blocked — offers to resend the link.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user, refreshUser } = useAuth();

  // 'verifying' | 'success' | 'error' | 'missing'
  const [status, setStatus] = useState(token ? 'verifying' : 'missing');
  const [message, setMessage] = useState('');
  const ran = useRef(false); // guard against StrictMode double-invoke

  // Resend state, used when there's no token (or the token was bad).
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

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

  async function handleResend() {
    setResending(true);
    setResendError('');
    try {
      await authApi.resendVerification();
      setResent(true);
    } catch (error) {
      setResendError(getErrorMessage(error, 'Could not send the email. Please try again.'));
    } finally {
      setResending(false);
    }
  }

  const alreadyVerified = isAuthenticated && user?.isEmailVerified;

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
          <Link to={isAuthenticated ? '/browse' : '/login'}>
            <Button fullWidth size="lg">
              {isAuthenticated ? 'Explore your feed' : 'Continue to log in'}
            </Button>
          </Link>
        </div>
      )}

      {(status === 'error' || status === 'missing') && (
        <div className="space-y-4">
          {alreadyVerified ? (
            <>
              <Alert variant="success">Your email is already verified. Nothing to do here 🎉</Alert>
              <Link to="/dashboard">
                <Button fullWidth size="lg">
                  Go to dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              {status === 'error' && <Alert variant="error">{message}</Alert>}

              {resent ? (
                <Alert variant="success">
                  Verification email sent to <strong>{user?.email}</strong>. Check your inbox (and
                  the spam folder), then click the link.
                </Alert>
              ) : (
                <>
                  {resendError && <Alert variant="error">{resendError}</Alert>}
                  <p className="text-sm text-slate-600">
                    {isAuthenticated
                      ? 'Confirm your email address to post opportunities, message students, and express interest.'
                      : 'Log in first, then we can send you a fresh verification link.'}
                  </p>
                </>
              )}

              {isAuthenticated ? (
                <Button
                  fullWidth
                  size="lg"
                  variant={resent ? 'secondary' : 'primary'}
                  loading={resending}
                  onClick={handleResend}
                >
                  {resent ? 'Send it again' : 'Send verification email'}
                </Button>
              ) : (
                <Link to="/login">
                  <Button fullWidth size="lg">
                    Log in
                  </Button>
                </Link>
              )}

              <Link to={isAuthenticated ? '/dashboard' : '/'}>
                <Button fullWidth variant="ghost">
                  {isAuthenticated ? 'Back to dashboard' : 'Back to home'}
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </AuthCard>
  );
}
