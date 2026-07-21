import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge Tailwind class names intelligently.
 * Combines conditional classes (clsx) and resolves conflicting Tailwind
 * utilities so the last one wins (twMerge). e.g. cn('p-2', isBig && 'p-4').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
