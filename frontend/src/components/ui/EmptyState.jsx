import Card from './Card';
import { cn } from '@/utils/cn';

/**
 * EmptyState — a friendly placeholder for empty lists.
 * `icon` is a lucide component; `action` is an optional node (e.g. a button).
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {Icon && <Icon className="h-7 w-7" />}
      </span>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
