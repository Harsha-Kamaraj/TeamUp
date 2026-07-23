import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Select — labeled dropdown. Pass `options` as [{ value, label }] or provide
 * <option> children directly. Works with React Hook Form's register.
 */
const Select = forwardRef(function Select(
  { label, hint, error, className, id, options, children, ...props },
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
      <select
        id={fieldId}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'bg-card w-full appearance-none rounded-lg border bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2 pr-10 text-sm text-slate-900 transition',
          'focus:ring-2 focus:outline-none',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-500/15',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
