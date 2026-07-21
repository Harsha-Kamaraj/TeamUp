import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '@/api/authApi';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async ({ password }) => {
    setFormError('');
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', {
        replace: true,
        state: { notice: 'Password reset successfully. Please log in with your new password.' },
      });
    } catch (error) {
      setFormError(getErrorMessage(error, 'This reset link is invalid or has expired.'));
    }
  };

  return (
    <AuthCard
      title="Set a new password"
      footer={
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      }
    >
      {!token ? (
        <Alert variant="error">
          This reset link is missing its token. Please request a new link from the{' '}
          <Link to="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>{' '}
          page.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Alert variant="error">{formError}</Alert>

          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Use 8+ characters with a letter and a number."
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: {
                hasLetter: (v) => /[A-Za-z]/.test(v) || 'Password must contain a letter',
                hasNumber: (v) => /\d/.test(v) || 'Password must contain a number',
              },
            })}
          />

          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === getValues('password') || 'Passwords do not match',
            })}
          />

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
