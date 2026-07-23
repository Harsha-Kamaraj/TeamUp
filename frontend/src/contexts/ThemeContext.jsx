import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'squadly-theme';

/** Read the theme already applied to <html> by the pre-paint script in index.html. */
function currentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * ThemeProvider — light/dark theme with localStorage persistence.
 * The initial class is set by an inline script in index.html (before paint) to
 * avoid a flash; this provider keeps React state in sync and handles toggling.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(currentTheme);

  const setTheme = useCallback((next) => {
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  // Re-sync once after mount in case the pre-paint script ran differently.
  useEffect(() => {
    setThemeState(currentTheme());
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
