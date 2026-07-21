import { useEffect, useState } from 'react';

/**
 * useDebounce — returns a value that only updates after `delay` ms of no
 * changes. Used to avoid firing a search request on every keystroke.
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
