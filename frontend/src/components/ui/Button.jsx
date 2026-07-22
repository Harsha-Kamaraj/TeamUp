import { cn } from '@/utils/cn';
import Spinner from './Spinner';

/**
 * Button — friendly & vibrant. Primary uses the signature gradient.
 *
 * variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
const VARIANTS = {
  primary:
    'bg-brand-gradient text-white shadow-sm transition-[filter,box-shadow] hover:brightness-[1.06] hover:shadow-md',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300',
  outline: 'border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-colors',
        'focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
