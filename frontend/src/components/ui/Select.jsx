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
          'w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          error ? 'border-red-400' : 'border-slate-300',
          className
        )}
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
