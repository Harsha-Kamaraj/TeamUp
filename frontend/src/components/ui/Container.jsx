import { cn } from '@/utils/cn';

/**
 * Container — centers content and applies consistent max-width + horizontal
 * padding so every page lines up. Used inside the navbar, footer, and pages.
 */
export default function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}
