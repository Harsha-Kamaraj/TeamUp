import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { Alert, Button, Card, Container, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function MyPostsPage() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['my-posts'],
    queryFn: postApi.getMine,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
    await postApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
  };

  return (
    <Container className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My opportunities</h1>
        <Link to="/posts/new">
          <Button>+ Create</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your opportunities.</Alert>}

      {posts && posts.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">📭</span>
          <h2 className="text-lg font-bold text-slate-900">No opportunities yet</h2>
          <p className="max-w-sm text-sm text-slate-500">
            Create your first opportunity to start finding teammates.
          </p>
          <Link to="/posts/new" className="mt-2">
            <Button size="lg">Create an opportunity</Button>
          </Link>
        </Card>
      )}

      {posts && posts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showAuthor={false}
              actions={
                <>
                  <Link to={`/posts/${post.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                    Delete
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
    </Container>
  );
}
