/**
 * Post/opportunity option metadata — kept in sync with the backend Post enums.
 */
export const POST_TYPES = [
  { value: 'hackathon', label: 'Hackathon', icon: '💻' },
  { value: 'research', label: 'Research', icon: '🔬' },
  { value: 'startup', label: 'Startup', icon: '🚀' },
  { value: 'competition', label: 'Competition', icon: '🏆' },
  { value: 'open-source', label: 'Open Source', icon: '🌱' },
  { value: 'club', label: 'Club Activity', icon: '🎭' },
  { value: 'project', label: 'Project Collaboration', icon: '🛠️' },
];

export const POST_TYPE_MAP = Object.fromEntries(POST_TYPES.map((t) => [t.value, t]));

export const POST_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'offline', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const POST_MODE_MAP = Object.fromEntries(POST_MODES.map((m) => [m.value, m]));
