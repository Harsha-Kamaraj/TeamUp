import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HandHeart } from 'lucide-react';
import { interestApi } from '@/api/interestApi';
import { Alert, Button, Container, EmptyState, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function MyInterestsPage() {
  const { data: interests, isLoading, isError } = useQuery({
    queryKey: ['my-interests'],
    queryFn: interestApi.mine,
  });

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Interested posts 💜</h1>
        <p className="mt-1 text-slate-500">Posts you&apos;ve expressed interest in.</p>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your interests.</Alert>}

      {interests && interests.length === 0 && (
        <EmptyState
          icon={HandHeart}
          title="No interests yet"
          description="Explore Your Feed and click “I’m interested” to track posts here."
          action={
            <Link to="/browse">
              <Button size="lg">Explore Your Feed</Button>
            </Link>
          }
        />
      )}

      {interests && interests.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map((interest) => (
            <PostCard key={interest.id} post={interest.post} />
          ))}
        </div>
      )}
    </Container>
  );
}
