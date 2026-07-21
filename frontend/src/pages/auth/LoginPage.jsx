import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');
  // Success notice passed via redirect (e.g. after resetting a password).
  const notice = location.state?.notice;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
      const redirectTo = location.state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to log in. Please try again.'));
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to find your next team"
      footer={
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
          placeholder="you@college.edu"
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

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
