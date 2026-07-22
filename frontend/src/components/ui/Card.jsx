import { cn } from '@/utils/cn';

/**
 * Card — a rounded white surface with soft depth (feed-card feel).
 * `hover` lifts it on hover for interactive cards.
 */
export default function Card({ hover = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card',
        hover && 'transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
