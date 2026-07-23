import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Plus } from 'lucide-react';
import { Alert, Button, Card, Container, EmptyState, Input, Select } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';
import { POST_TYPES, POST_MODES } from '@/lib/postOptions';
import { cn } from '@/utils/cn';

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="h-5 w-24 rounded bg-slate-100" />
          <div className="mt-4 h-5 w-3/4 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
            <div className="h-6 w-16 rounded-full bg-slate-100" />
          </div>
        </Card>
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
    <Container className="py-10">
      <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Feed ✨</h1>
          <p className="mt-1 text-slate-500">
            {isLoading ? 'Loading…' : `${total} ${total === 1 ? 'post' : 'posts'} to explore`}
          </p>
        </div>
        <Link to={isAuthenticated ? '/posts/new' : '/register'}>
          <Button>
            <Plus className="h-4 w-4" /> Create post
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search by title, skill, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search posts"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={MODE_OPTIONS}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Filter by work mode"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setType('')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              type === ''
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'bg-card border-slate-200 text-slate-600 hover:bg-slate-50'
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
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                type === t.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'bg-card border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <t.Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

      {isLoading && <SkeletonGrid />}

      {isError && <Alert variant="error">Could not load posts. Please try again.</Alert>}

      {!isLoading && posts.length === 0 && (
        <EmptyState
          icon={Search}
          title={hasFilters ? 'No posts match your filters' : 'No posts yet'}
          description={
            hasFilters
              ? 'Try a different search or clear the filters.'
              : 'Be the first to post and start building your team. 🚀'
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link to={isAuthenticated ? '/posts/new' : '/register'}>
                <Button size="lg">Create a post</Button>
              </Link>
            )
          }
        />
      )}

      {posts.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 9) * 60}ms` }}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
