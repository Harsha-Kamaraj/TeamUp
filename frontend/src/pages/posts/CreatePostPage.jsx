import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { Card, Container } from '@/components/ui';
import PostForm from '@/components/posts/PostForm';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const onSubmit = async (values) => {
    const post = await postApi.create(values);
    queryClient.invalidateQueries({ queryKey: ['my-posts'] });
    navigate(`/posts/${post.id}`);
  };

  return (
    <Container className="max-w-3xl py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create an opportunity</h1>
        <p className="mt-1 text-slate-500">Tell others what you&apos;re building and who you need.</p>
      </div>
      <Card className="p-6 sm:p-8">
        <PostForm onSubmit={onSubmit} submitLabel="Publish opportunity" />
      </Card>
    </Container>
  );
}
