import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookmarkApi } from '@/api/bookmarkApi';
import { Alert, Button, Card, Container, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function SavedPostsPage() {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkApi.list,
  });

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Saved opportunities</h1>
        <p className="mt-1 text-slate-500">Opportunities you&apos;ve bookmarked for later.</p>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your saved opportunities.</Alert>}

      {posts && posts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔖</span>
          <h2 className="text-lg font-bold text-slate-900">Nothing saved yet</h2>
          <p className="max-w-sm text-sm text-slate-500">
            Tap the bookmark icon on any opportunity to save it here for later.
          </p>
          <Link to="/browse" className="mt-2">
            <Button size="lg">Browse opportunities</Button>
          </Link>
        </Card>
      )}

      {posts && posts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
