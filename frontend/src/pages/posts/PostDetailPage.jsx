import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Badge, Button, Card, Container, Spinner } from '@/components/ui';
import { POST_TYPE_MAP, POST_MODE_MAP } from '@/lib/postOptions';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [interestNote, setInterestNote] = useState('');

  const { data: post, isLoading, isError, error } = useQuery({
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
        <Alert variant="error">
          {error?.response?.status === 404
            ? 'This opportunity could not be found.'
            : 'Something went wrong loading this opportunity.'}
        </Alert>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline">Back to home</Button>
        </Link>
      </Container>
    );
  }

  const type = POST_TYPE_MAP[post.type] ?? { label: post.type, icon: '📌' };
  const isOwner = post.author?.id === user?.id;
  const deadline = formatDate(post.deadline);

  const handleDelete = async () => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await postApi.remove(id);
      queryClient.removeQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts-feed'] });
      navigate('/my-posts', { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="max-w-3xl py-10">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="slate">
            <span aria-hidden>{type.icon}</span> {type.label}
          </Badge>
          {post.status === 'closed' && <Badge variant="amber">Closed</Badge>}
          <span className="ml-auto text-xs text-slate-400">
            {POST_MODE_MAP[post.mode]?.label ?? post.mode}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">{post.title}</h1>

        {/* Author */}
        {post.author && (
          <Link
            to={`/profile/${post.author.id}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <Avatar name={post.author.name} src={post.author.avatar} size="sm" />
            <span>
              {post.author.name}
              {post.author.college ? ` · ${post.author.college}` : ''}
            </span>
          </Link>
        )}

        {/* Meta */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <span>👥 <strong className="font-semibold">{post.membersNeeded}</strong> members needed</span>
          {post.location && <span>📍 {post.location}</span>}
          {deadline && <span>🗓️ Apply by {deadline}</span>}
        </div>

        {/* Description */}
        <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-700">{post.description}</p>

        {/* Skills */}
        {post.requiredSkills?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Required skills
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {post.requiredSkills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} variant="slate">
                #{t}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
          {isOwner ? (
            <>
              <Link to={`/posts/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
            </>
          ) : (
            <Button
              disabled={post.status === 'closed'}
              onClick={() =>
                setInterestNote("You're interested! The interest & chat workflow arrives in an upcoming phase.")
              }
            >
              {post.status === 'closed' ? 'Closed' : "I'm interested"}
            </Button>
          )}
        </div>

        {interestNote && (
          <div className="mt-4">
            <Alert variant="info">{interestNote}</Alert>
          </div>
        )}
      </Card>
    </Container>
  );
}
