import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, HandHeart } from 'lucide-react';
import { bookmarkApi } from '@/api/bookmarkApi';
import { interestApi } from '@/api/interestApi';
import { Alert, Button, Container, EmptyState, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';
import { cn } from '@/utils/cn';

/**
 * MyLibraryPage — the two personal collections (interests + saved) in one place.
 *
 * They were separate pages with near-identical layouts, which meant two menu
 * entries and a page reload to move between them. The active tab lives in the
 * query string so a tab is linkable and survives refresh/back.
 */
const TABS = [
  { key: 'interests', label: 'Interested', icon: HandHeart },
  { key: 'saved', label: 'Saved', icon: Bookmark },
];

export default function MyLibraryPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'saved' ? 'saved' : 'interests';

  const interestsQuery = useQuery({
    queryKey: ['my-interests'],
    queryFn: interestApi.mine,
    enabled: tab === 'interests',
  });
  const savedQuery = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkApi.list,
    enabled: tab === 'saved',
  });

  const active = tab === 'saved' ? savedQuery : interestsQuery;
  // Interests wrap the post; bookmarks return posts directly.
  const posts =
    tab === 'saved'
      ? (savedQuery.data ?? [])
      : (interestsQuery.data ?? []).map((i) => i.post).filter(Boolean);

  return (
    <Container className="py-10">
      <div className="animate-fade-up mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My library</h1>
        <p className="mt-1 text-slate-500">Opportunities you are following.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-card-2 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams(key === 'interests' ? {} : { tab: key }, { replace: true })}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
              tab === key
                ? 'bg-brand-gradient text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {active.isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {active.isError && (
        <Alert variant="error">
          Could not load your {tab === 'saved' ? 'saved posts' : 'interests'}.
        </Alert>
      )}

      {active.data && posts.length === 0 && (
        <EmptyState
          icon={tab === 'saved' ? Bookmark : HandHeart}
          title={tab === 'saved' ? 'Nothing saved yet' : 'No interests yet'}
          description={
            tab === 'saved'
              ? 'Tap the bookmark icon on any post to save it here for later.'
              : 'Explore your feed and click “I’m interested” to track posts here.'
          }
          action={
            <Link to="/browse">
              <Button size="lg">Explore the feed</Button>
            </Link>
          }
        />
      )}

      {posts.length > 0 && (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
