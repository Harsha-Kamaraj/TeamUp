import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Logo — a vibrant gradient mark + clean wordmark. */
export default function Logo({ className }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="bg-brand-gradient grid h-8 w-8 place-items-center rounded-xl text-white shadow-sm"
      >
        <Users className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </span>
      <span className="text-[17px] font-bold tracking-tight text-slate-900">Squadly</span>
    </Link>
  );
}
