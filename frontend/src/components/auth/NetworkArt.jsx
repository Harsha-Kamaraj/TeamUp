/**
 * NetworkArt — the illustration on the auth split-screen.
 *
 * A student network: people (nodes) discovering each other through connections
 * (links). Drawn as inline SVG rather than a bitmap so it stays crisp at any
 * size, weighs a few KB, needs no external request (our CSP-friendly default),
 * and can pick up the brand gradient directly.
 *
 * Motion is CSS-driven and respects `prefers-reduced-motion` via the global
 * rule in index.css.
 */

// Node positions on a 400x400 viewBox. `r` drives size; `delay` staggers the
// pulse so the graph feels alive rather than blinking in unison.
const NODES = [
  { id: 'a', x: 200, y: 92, r: 21, delay: 0 },
  { id: 'b', x: 96, y: 158, r: 15, delay: 0.6 },
  { id: 'c', x: 305, y: 150, r: 16, delay: 1.2 },
  { id: 'd', x: 150, y: 254, r: 18, delay: 0.3 },
  { id: 'e', x: 268, y: 262, r: 14, delay: 1.5 },
  { id: 'f', x: 62, y: 300, r: 11, delay: 0.9 },
  { id: 'g', x: 340, y: 320, r: 12, delay: 1.8 },
  { id: 'h', x: 205, y: 355, r: 10, delay: 2.1 },
];

// Which nodes are connected. Order matters only for the draw animation.
const LINKS = [
  ['a', 'b'],
  ['a', 'c'],
  ['a', 'd'],
  ['b', 'd'],
  ['c', 'e'],
  ['d', 'e'],
  ['b', 'f'],
  ['d', 'f'],
  ['e', 'g'],
  ['d', 'h'],
  ['e', 'h'],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

export default function NetworkArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="na-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#c4b5fd" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id="na-node" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>

        {/* Soft bloom so nodes read as glowing rather than flat discs. */}
        <filter id="na-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Connections, drawn first so nodes sit on top. */}
      <g stroke="url(#na-line)" strokeLinecap="round">
        {LINKS.map(([from, to], i) => {
          const a = byId[from];
          const b = byId[to];
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeWidth={1.5}
              className="na-link"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          );
        })}
      </g>

      {/* Travelling pulses along a few links — the "discovery" moment. */}
      <g fill="#f0abfc">
        {[
          ['a', 'd'],
          ['c', 'e'],
          ['b', 'f'],
        ].map(([from, to], i) => {
          const a = byId[from];
          const b = byId[to];
          return (
            <circle key={`p-${from}-${to}`} r="3" className="na-spark">
              <animate
                attributeName="cx"
                values={`${a.x};${b.x};${a.x}`}
                dur="6s"
                begin={`${i * 1.7}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${a.y};${b.y};${a.y}`}
                dur="6s"
                begin={`${i * 1.7}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </g>

      {/* People. */}
      <g filter="url(#na-glow)">
        {NODES.map((n) => (
          <g key={n.id} className="na-node" style={{ animationDelay: `${n.delay}s` }}>
            <circle cx={n.x} cy={n.y} r={n.r} fill="url(#na-node)" />
            {/* Simple head-and-shoulders mark, scaled to the node. */}
            <g
              fill="#fff"
              opacity="0.92"
              transform={`translate(${n.x} ${n.y}) scale(${n.r / 21})`}
            >
              <circle cy="-5.5" r="5" />
              <path d="M-9 8.5a9 9 0 0 1 18 0Z" />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
