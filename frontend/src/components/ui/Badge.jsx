import { cn } from '@/utils/cn';

/** Badge — a rounded pill for tags, categories, and status. */
const VARIANTS = {
  brand: 'bg-brand-50 text-brand-700',
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
};

export default function Badge({ variant = 'slate', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
