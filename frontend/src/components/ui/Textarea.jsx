import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

/** Textarea — multiline field matching the Input styling. Works with RHF. */
const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, id, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition',
          'placeholder:text-slate-400',
          'focus:ring-2 focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-500/15',
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

export default Textarea;
