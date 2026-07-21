import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/authApi';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="We'll email you a link to reset it"
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success">
          If an account exists for that email, a password reset link is on its way. Check your inbox
          (and the server console in development).
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
