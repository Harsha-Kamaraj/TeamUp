import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Input — labeled text field with optional hint and error message.
 *
 * For `type="password"`, a show/hide (eye) toggle is rendered automatically.
 * Uses forwardRef so it works directly with React Hook Form's `register`:
 *   <Input label="Email" {...register('email')} error={errors.email?.message} />
 */
const Input = forwardRef(function Input(
  { label, hint, error, className, id, type = 'text', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const isPassword = type === 'password';
  const [reveal, setReveal] = useState(false);
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={inputType}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition',
            'placeholder:text-slate-400',
            'focus:ring-2 focus:outline-none',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-500/15',
            isPassword && 'pr-11',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            title={reveal ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
          >
            {reveal ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
