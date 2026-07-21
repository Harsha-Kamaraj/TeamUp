import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

/**
 * Logo — the TeamUp wordmark. Links home by default.
 */
export default function Logo({ className }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-sm"
      >
        🤝
      </span>
      <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-xl text-transparent">
        TeamUp
      </span>
    </Link>
  );
}
