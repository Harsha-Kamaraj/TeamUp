import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Button, Card, Container } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

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

export default function BrowsePage() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['posts-feed'],
      queryFn: ({ pageParam }) => postApi.list({ page: pageParam, limit: 12 }),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse opportunities</h1>
          <p className="mt-1 text-slate-500">
            {isLoading ? 'Loading…' : `${total} open ${total === 1 ? 'opportunity' : 'opportunities'}`}
          </p>
        </div>
        <Link to={isAuthenticated ? '/posts/new' : '/register'}>
          <Button>+ Create opportunity</Button>
        </Link>
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && <Alert variant="error">Could not load opportunities. Please try again.</Alert>}

      {!isLoading && posts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <h2 className="text-lg font-bold text-slate-900">No opportunities yet</h2>
          <p className="max-w-sm text-sm text-slate-500">
            Be the first to post one and start building your team.
          </p>
          <Link to={isAuthenticated ? '/posts/new' : '/register'} className="mt-2">
            <Button size="lg">Create an opportunity</Button>
          </Link>
        </Card>
      )}

      {posts.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
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
