import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, Button, EmptyState, Select } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';
import FeedNav from '@/components/feed/FeedNav';
import FeedSidebar from '@/components/feed/FeedSidebar';
import FeedSearch from '@/components/feed/FeedSearch';
import { POST_TYPES, POST_MODES } from '@/lib/postOptions';
import { cn } from '@/utils/cn';

// Mirrors the real feed: one full-width card per row.
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card animate-pulse rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-slate-100" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-2.5 w-20 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
          <div className="mt-2.5 h-3 w-full rounded bg-slate-100" />
          <div className="mt-1.5 h-3 w-5/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

const MODE_OPTIONS = [{ value: '', label: 'Any mode' }, ...POST_MODES];

export default function BrowsePage() {
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const filters = { search: debouncedSearch, type, mode };
  const hasFilters = Boolean(debouncedSearch || type || mode);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['posts-feed', filters],
      queryFn: ({ pageParam }) => postApi.list({ ...filters, page: pageParam, limit: 12 }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const clearFilters = () => {
    setSearch('');
    setType('');
    setMode('');
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
      {/* Three columns: nav rail, feed, context rail. The rails collapse on
          smaller screens, leaving the feed centred and readable. */}
      <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,620px)_300px] xl:justify-center">
        <FeedNav />

        <main className="min-w-0">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[19px] font-semibold tracking-tight text-slate-900">Feed</h1>
              <p className="text-[13px] text-slate-500">
                {isLoading ? 'Loading…' : `${total} open ${total === 1 ? 'opportunity' : 'opportunities'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors',
                hasFilters || filtersOpen
                  ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/15'
                  : 'bg-card border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasFilters && (
                <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {[debouncedSearch, type, mode].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <FeedSearch value={search} onChange={setSearch} />

            {/* Filters — collapsed by default so the feed leads. */}
            {filtersOpen && (
              <div className="bg-card space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="sm:w-44">
                  <Select
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    aria-label="Filter by work mode"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType('')}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                      type === ''
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                        : 'bg-card border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    All
                  </button>
                  {POST_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
                        type === t.value
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-card border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <t.Icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-slate-900"
                  >
                    <X className="h-3.5 w-3.5" /> Clear filters
                  </button>
                )}
              </div>
            )}

            {isLoading && <FeedSkeleton />}

            {isError && <Alert variant="error">Could not load posts. Please try again.</Alert>}

            {!isLoading && posts.length === 0 && (
              <EmptyState
                icon={Search}
                title={hasFilters ? 'No posts match your filters' : 'No opportunities yet'}
                description={
                  hasFilters
                    ? 'Try a different search or clear the filters.'
                    : 'Be the first to post and start building your team.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    <Link to={isAuthenticated ? '/posts/new' : '/register'}>
                      <Button>Create a post</Button>
                    </Link>
                  )
                }
              />
            )}

            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasNextPage && (
              <div className="pt-2 pb-6 text-center">
                <Button
                  variant="outline"
                  loading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  Load more
                </Button>
              </div>
            )}
          </div>
        </main>

        <FeedSidebar />
      </div>
    </div>
  );
}
