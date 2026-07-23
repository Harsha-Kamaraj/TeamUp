import { cn } from '@/utils/cn';

/**
 * Alert — inline feedback banner for forms and pages.
 * variant: 'error' | 'success' | 'info'
 */
const VARIANTS = {
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
  info: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300',
};

const ICONS = { error: '⚠️', success: '✅', info: 'ℹ️' };

export default function Alert({ variant = 'info', className, children }) {
  if (!children) return null;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm',
        VARIANTS[variant],
        className
      )}
    >
      <span aria-hidden className="mt-px">
        {ICONS[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
