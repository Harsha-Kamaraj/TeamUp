import { cn } from '@/utils/cn';

/**
 * Card — rounded, softly shadowed surface used across the app.
 * `hover` adds a subtle lift for clickable cards (e.g. opportunity posts).
 */
export default function Card({ hover = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card',
        hover && 'transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
