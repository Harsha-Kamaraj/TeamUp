import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Plus } from 'lucide-react';
import { postApi } from '@/api/postApi';
import { Alert, Button, Container, EmptyState, Spinner } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';

export default function MyPostsPage() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ['my-posts'],
    queryFn: postApi.getMine,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    await postApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
  };

  return (
    <Container className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My posts 📢</h1>
        <Link to="/posts/new">
          <Button>
            <Plus className="h-4 w-4" /> Create post
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid min-h-[40vh] place-items-center text-brand-600">
          <Spinner size="lg" />
        </div>
      )}

      {isError && <Alert variant="error">Could not load your posts.</Alert>}

      {posts && posts.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No posts yet"
          description="Create your first post to start finding teammates."
          action={
            <Link to="/posts/new">
              <Button size="lg">Create a post</Button>
            </Link>
          }
        />
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
