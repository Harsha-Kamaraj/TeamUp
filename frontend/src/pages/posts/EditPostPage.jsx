import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Button, Card, Container, Spinner } from '@/components/ui';
import PostForm from '@/components/posts/PostForm';

// ISO date → 'YYYY-MM-DD' for the <input type="date">.
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-brand-600">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <Container className="py-16">
        <Alert variant="error">This opportunity could not be found.</Alert>
      </Container>
    );
  }

  const isOwner = post.author?.id === user?.id;
  if (!isOwner) {
    return (
      <Container className="py-16">
        <Alert variant="error">You can only edit your own opportunities.</Alert>
        <Link to={`/posts/${id}`} className="mt-4 inline-block">
          <Button variant="outline">Back to opportunity</Button>
        </Link>
      </Container>
    );
  }

  const defaultValues = {
    type: post.type,
    title: post.title,
    description: post.description,
    requiredSkills: post.requiredSkills ?? [],
    membersNeeded: post.membersNeeded ?? 1,
    mode: post.mode,
    location: post.location ?? '',
    deadline: toDateInput(post.deadline),
    tags: post.tags ?? [],
    status: post.status,
  };

  const onSubmit = async (values) => {
    const updated = await postApi.update(id, values);
    // Refresh caches so the detail + list pages show the new data immediately.
    queryClient.setQueryData(['post', id], updated);
    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
    navigate(`/posts/${id}`);
  };

  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Edit opportunity</h1>
        <Link to={`/posts/${id}`}>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
      <Card className="p-6 sm:p-8">
        <PostForm defaultValues={defaultValues} onSubmit={onSubmit} submitLabel="Save changes" showStatus />
      </Card>
    </Container>
  );
}
