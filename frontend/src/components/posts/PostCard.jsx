import { Link } from 'react-router-dom';
import { Avatar, Badge, Card } from '@/components/ui';
import { POST_TYPE_MAP, POST_MODE_MAP } from '@/lib/postOptions';

function formatDeadline(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * PostCard — compact opportunity summary. `actions` renders a footer (e.g.
 * owner edit/delete). `showAuthor` toggles the author row (off for "my posts").
 */
export default function PostCard({ post, actions = null, showAuthor = true }) {
  const type = POST_TYPE_MAP[post.type] ?? { label: post.type, icon: '📌' };
  const deadline = formatDeadline(post.deadline);
  const isClosed = post.status === 'closed';

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="slate">
            <span aria-hidden>{type.icon}</span> {type.label}
          </Badge>
          {isClosed && <Badge variant="amber">Closed</Badge>}
        </div>
        <span className="text-xs text-slate-400">
          {POST_MODE_MAP[post.mode]?.label ?? post.mode}
        </span>
      </div>

      <div>
        <Link to={`/posts/${post.id}`}>
          <h3 className="text-lg font-bold text-slate-900 hover:text-brand-700">{post.title}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.description}</p>
      </div>

      {post.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.requiredSkills.slice(0, 6).map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>👥 {post.membersNeeded} needed</span>
        {post.location && <span>📍 {post.location}</span>}
        {deadline && <span>🗓️ by {deadline}</span>}
      </div>

      {(showAuthor && post.author) || actions ? (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {showAuthor && post.author ? (
            <Link
              to={`/profile/${post.author.id}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <Avatar name={post.author.name} src={post.author.avatar} size="sm" />
              <span>{post.author.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      ) : null}
    </Card>
  );
}
