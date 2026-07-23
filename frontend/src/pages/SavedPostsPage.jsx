import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { bookmarkApi } from '@/api/bookmarkApi';
import { Alert, Button, Container, EmptyState, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function SavedPostsPage() {
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkApi.list,
  });

  return (
    <Container className="py-10">
      <div className="animate-fade-up mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Saved posts 🔖</h1>
        <p className="mt-1 text-slate-500">Posts you&apos;ve bookmarked for later.</p>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your saved posts.</Alert>}

      {posts && posts.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any post to save it here for later."
          action={
            <Link to="/browse">
              <Button size="lg">Explore Your Feed</Button>
            </Link>
          }
        />
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
