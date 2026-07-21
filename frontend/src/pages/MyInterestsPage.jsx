import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { interestApi } from '@/api/interestApi';
import { Alert, Button, Card, Container, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function MyInterestsPage() {
  const { data: interests, isLoading, isError } = useQuery({
    queryKey: ['my-interests'],
    queryFn: interestApi.mine,
  });

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Interested opportunities</h1>
        <p className="mt-1 text-slate-500">Opportunities you&apos;ve expressed interest in.</p>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your interests.</Alert>}

      {interests && interests.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🙋</span>
          <h2 className="text-lg font-bold text-slate-900">No interests yet</h2>
          <p className="max-w-sm text-sm text-slate-500">
            Browse opportunities and click “I&apos;m interested” to track them here.
          </p>
          <Link to="/browse" className="mt-2">
            <Button size="lg">Browse opportunities</Button>
          </Link>
        </Card>
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
