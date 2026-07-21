import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const onSubmit = async ({ name, email, password }) => {
    setFormError('');
    try {
      await registerUser({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create your account. Please try again.'));
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join TeamUp and start building with others"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert variant="error">{formError}</Alert>

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
        />

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

        <Input
          label="Password"
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
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === getValues('password') || 'Passwords do not match',
          })}
        />

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
