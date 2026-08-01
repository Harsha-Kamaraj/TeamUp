import { Link } from 'react-router-dom';
import { Users, MapPin, CalendarDays, HandHeart, MessageSquare } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import BookmarkButton from './BookmarkButton';
import { postTypeMeta, POST_MODE_MAP } from '@/lib/postOptions';
import { timeAgo } from '@/utils/timeAgo';

function formatDeadline(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * PostCard — one opportunity in the feed.
 *
 * Laid out like a professional network post: author identity first, then the
 * content, then a quiet metadata row. Restraint is deliberate — a card competing
 * for attention with gradients and heavy shadows reads as unserious, and these
 * posts are students asking for real collaborators.
 *
 * `actions` renders an owner footer (edit/delete). `showAuthor` hides the author
 * row on "my posts", where every card is yours.
 */
export default function PostCard({ post, actions = null, showAuthor = true }) {
  const type = postTypeMeta(post);
  const TypeIcon = type.Icon;
  const deadline = formatDeadline(post.deadline);
  const isClosed = post.status === 'closed';
  const mode = POST_MODE_MAP[post.mode]?.label ?? post.mode;
  const author = post.author;

  return (
    <article className="bg-card rounded-xl border border-slate-200 transition-colors hover:border-slate-300">
      {/* Author */}
      {showAuthor && author && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <Link to={`/profile/${author.id}`} className="group flex min-w-0 items-center gap-2.5">
            <Avatar name={author.name} src={author.avatar} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-slate-900 group-hover:text-brand-700">
                {author.name}
              </span>
              <span className="block truncate text-[12.5px] text-slate-500">
                {[author.college, author.year].filter(Boolean).join(' · ') || 'Student'}
                <span className="text-slate-300"> · </span>
                {timeAgo(post.createdAt)}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            {isClosed && <Badge variant="slate">Closed</Badge>}
            <BookmarkButton postId={post.id} />
          </div>
        </header>
      )}

      {/* Body */}
      <div className="px-4 pt-3 sm:px-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {TypeIcon && <TypeIcon className="h-3.5 w-3.5" />}
            {type.label}
          </span>
          <span className="text-[12px] text-slate-400">{mode}</span>
        </div>

        <Link to={`/posts/${post.id}`}>
          <h2 className="text-[17px] leading-snug font-semibold tracking-tight text-slate-900 transition-colors hover:text-brand-700">
            {post.title}
          </h2>
        </Link>

        <p className="mt-1.5 line-clamp-3 text-[14.5px] leading-relaxed text-slate-600">
          {post.description}
        </p>

        {post.requiredSkills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.requiredSkills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-slate-200 px-2 py-0.5 text-[12px] text-slate-600"
              >
                {skill}
              </span>
            ))}
            {post.requiredSkills.length > 6 && (
              <span className="px-1 py-0.5 text-[12px] text-slate-400">
                +{post.requiredSkills.length - 6}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <footer className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 px-4 py-2.5 text-[12.5px] text-slate-500 sm:px-5">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {post.membersNeeded} needed
        </span>
        {post.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {post.location}
          </span>
        )}
        {deadline && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            {deadline}
          </span>
        )}
        {post.interestCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <HandHeart className="h-3.5 w-3.5 text-slate-400" />
            {post.interestCount}
          </span>
        )}

        <Link
          to={`/posts/${post.id}`}
          className="ml-auto inline-flex items-center gap-1.5 font-medium text-brand-600 transition-colors hover:text-brand-700"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          View details
        </Link>
      </footer>

      {actions && (
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">{actions}</div>
      )}
    </article>
  );
}
