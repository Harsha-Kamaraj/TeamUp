import { cn } from '@/utils/cn';

/** Badge — small pill used for skills, tags, and status labels. */
const VARIANTS = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function Badge({ variant = 'brand', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
