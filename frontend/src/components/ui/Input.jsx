import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Input — labeled text field with optional hint and error message.
 *
 * Uses forwardRef so it works directly with React Hook Form's `register`:
 *   <Input label="Email" {...register('email')} error={errors.email?.message} />
 */
const Input = forwardRef(function Input(
  { label, hint, error, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition',
          'placeholder:text-slate-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
          className
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
