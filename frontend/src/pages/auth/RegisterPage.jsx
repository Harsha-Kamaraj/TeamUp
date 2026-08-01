import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { config } from '@/lib/config';
import { Alert, Button, Input } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function RegisterPage() {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

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
      navigate('/browse', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create your account. Please try again.'));
    }
  };

  const onGoogle = async (credential) => {
    setFormError('');
    setGoogleBusy(true);
    try {
      await loginWithGoogle(credential);
      navigate('/browse', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Google sign-up failed. Please try again.'));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <AuthLayout
      slide={2}
      title="Create an account"
      subtitle={
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
          placeholder="you@gmail.com"
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

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600"
          />
          <span>
            I agree to the{' '}
            <Link to="/" className="font-medium text-brand-600 underline hover:text-brand-700">
              Terms &amp; Conditions
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!agreed}
          loading={isSubmitting || googleBusy}
        >
          Create account
        </Button>
      </form>

      {config.googleClientId && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[13px] text-slate-500">Or register with</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleSignInButton onCredential={onGoogle} text="signup_with" />
        </>
      )}
    </AuthLayout>
  );
}
