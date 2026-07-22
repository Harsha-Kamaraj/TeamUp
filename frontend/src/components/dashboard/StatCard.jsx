import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';

/**
 * StatCard — a headline number with an icon and label. If `to` is provided the
 * whole card links there.
 */
export default function StatCard({ icon: Icon, label, value, to }) {
  const inner = (
    <Card hover={!!to} className="flex h-full items-center gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );

  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
