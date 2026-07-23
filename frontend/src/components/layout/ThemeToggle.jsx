import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/** Animated light/dark toggle — the sun & moon cross-rotate on switch. */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${className}`}
    >
      <Sun
        className={`h-5 w-5 transition-all duration-500 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ${
          isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  );
}
