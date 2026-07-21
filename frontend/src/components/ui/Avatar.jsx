import { cn } from '@/utils/cn';

function initialsOf(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

const SIZES = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-28 w-28 text-3xl',
};

/**
 * Avatar — shows the user's photo, or their initials on a brand gradient.
 */
export default function Avatar({ name, src, size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white',
        SIZES[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name ? `${name}'s avatar` : 'avatar'} className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
