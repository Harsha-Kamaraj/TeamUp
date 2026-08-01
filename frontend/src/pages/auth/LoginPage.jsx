import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { config } from '@/lib/config';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  // Success notice passed via redirect (e.g. after resetting a password).
  const notice = location.state?.notice;

  // Land on the feed, not the dashboard — seeing opportunities is the reason
  // to log in. (If they were bounced here from a protected page, go back there.)
  const redirectTo = location.state?.from?.pathname ?? '/browse';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to log in. Please try again.'));
    }
  };

  const onGoogle = async (credential) => {
    setFormError('');
    setGoogleBusy(true);
    try {
      await loginWithGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Google sign-in failed. Please try again.'));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthLayout
      slide={0}
      title="Welcome back"
      subtitle={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {notice && <Alert variant="success">{notice}</Alert>}
        <Alert variant="error">{formError}</Alert>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@gmail.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          })}
        />

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting || googleBusy}>
          Log in
        </Button>
      </form>

      {/* Only rendered once a Google client ID is configured. */}
      {config.googleClientId && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[13px] text-slate-500">Or log in with</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleSignInButton onCredential={onGoogle} text="continue_with" />
        </>
      )}
    </AuthLayout>
  );
}
