import {
  Code2,
  FlaskConical,
  Rocket,
  Trophy,
  GitBranch,
  Users,
  Wrench,
  PartyPopper,
  Tag,
} from 'lucide-react';

/**
 * Post option metadata — kept in sync with the backend Post enums.
 * `Icon` is a lucide component. `emoji` is used for a friendlier, social feel.
 */
export const POST_TYPES = [
  { value: 'hackathon', label: 'Hackathon', emoji: '💻', Icon: Code2 },
  { value: 'research', label: 'Research', emoji: '🔬', Icon: FlaskConical },
  { value: 'startup', label: 'Startup', emoji: '🚀', Icon: Rocket },
  { value: 'competition', label: 'Competition', emoji: '🏆', Icon: Trophy },
  { value: 'open-source', label: 'Open Source', emoji: '🌐', Icon: GitBranch },
  { value: 'club', label: 'Club Activity', emoji: '🎓', Icon: Users },
  { value: 'project', label: 'Project Collab', emoji: '🛠️', Icon: Wrench },
  { value: 'other', label: 'Other (add your own)', emoji: '✨', Icon: PartyPopper },
];

export const POST_TYPE_MAP = Object.fromEntries(POST_TYPES.map((t) => [t.value, t]));

// Fallback for an unknown type.
export const FALLBACK_TYPE = { label: 'Post', emoji: '📌', Icon: Tag };

/**
 * Display metadata for a post's type. For the "other" type we surface the
 * student-supplied `customType` (e.g. "DJ Nite") as the label.
 */
export function postTypeMeta(post) {
  const meta = POST_TYPE_MAP[post?.type] ?? FALLBACK_TYPE;
  if (post?.type === 'other' && post?.customType) {
    return { ...meta, label: post.customType };
  }
  return meta;
}

export const POST_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'offline', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const POST_MODE_MAP = Object.fromEntries(POST_MODES.map((m) => [m.value, m]));
