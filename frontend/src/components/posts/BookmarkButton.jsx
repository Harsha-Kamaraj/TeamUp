import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookmarkApi } from '@/api/bookmarkApi';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

/**
 * BookmarkButton — save/unsave a post. Its saved state comes from a single
 * shared `['bookmarks']` query, so it works on every card without needing an
 * `isBookmarked` flag on each post. Guests are sent to login.
 */
export default function BookmarkButton({ postId, className }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkApi.list,
    enabled: isAuthenticated,
  });
  const bookmarked = !!posts?.some((p) => p.id === postId);

  const toggle = useMutation({
    mutationFn: () => (bookmarked ? bookmarkApi.remove(postId) : bookmarkApi.add(postId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const onClick = (e) => {
    // Don't trigger a surrounding card link.
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggle.mutate();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove from saved' : 'Save post'}
      title={bookmarked ? 'Saved' : 'Save'}
      className={cn(
        'rounded-lg p-1.5 transition-colors',
        bookmarked ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    </button>
  );
}
