/**
 * Minimal, dependency-free logger.
 *
 * Wraps `console` with timestamps and levels so log lines are consistent
 * and greppable. Kept intentionally small for Phase 1 — we can swap in a
 * fuller library (e.g. Winston/Pino) later without changing call sites,
 * because everything imports this single module.
 */
const COLORS = {
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  debug: '\x1b[90m', // gray
  reset: '\x1b[0m',
};

function format(level, args) {
  const timestamp = new Date().toISOString();
  const color = COLORS[level] ?? '';
  const label = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
  return [`${timestamp} ${label}`, ...args];
}

const logger = {
  info: (...args) => console.log(...format('info', args)),
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
  // Debug lines stay quiet unless explicitly enabled.
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...format('debug', args));
    }
  },
};

export default logger;
