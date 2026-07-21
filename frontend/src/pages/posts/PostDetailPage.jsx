import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/api/postApi';
import { interestApi } from '@/api/interestApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Badge, Button, Card, Container, Spinner, Textarea } from '@/components/ui';
import { POST_TYPE_MAP, POST_MODE_MAP } from '@/lib/postOptions';
import { getErrorMessage } from '@/utils/getErrorMessage';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;

/** Author-only list of students who expressed interest. */
function InterestedStudents({ postId }) {
  const { data: interests, isLoading } = useQuery({
    queryKey: ['post-interests', postId],
    queryFn: () => interestApi.forPost(postId),
  });

  return (
    <Card className="mt-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        Interested students{interests ? ` (${interests.length})` : ''}
      </h2>

      {isLoading ? (
        <div className="py-6 text-center text-brand-600">
          <Spinner />
        </div>
      ) : interests?.length ? (
        <ul className="mt-4 space-y-4">
          {interests.map((interest) => (
            <li key={interest.id} className="flex gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <Avatar name={interest.fromUser?.name} src={interest.fromUser?.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <Link
                    to={`/profile/${interest.fromUser?.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-700"
                  >
                    {interest.fromUser?.name}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {[interest.fromUser?.college, interest.fromUser?.year].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {interest.fromUser?.skills?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {interest.fromUser.skills.slice(0, 6).map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                )}
                {interest.message && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    “{interest.message}”
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" disabled title="Chat arrives in Phase 10">
                Message
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No interest yet. Share your opportunity!</p>
      )}
    </Card>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postApi.getById(id),
  });

  const invalidatePost = () => {
    queryClient.invalidateQueries({ queryKey: ['post', id] });
    queryClient.invalidateQueries({ queryKey: ['my-interests'] });
  };

  const expressMutation = useMutation({
    mutationFn: () => interestApi.express(id, note),
    onSuccess: () => {
      setNoteOpen(false);
      setNote('');
      setActionError('');
      invalidatePost();
    },
    onError: (err) => setActionError(getErrorMessage(err)),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => interestApi.withdraw(id),
    onSuccess: () => {
      setActionError('');
      invalidatePost();
    },
    onError: (err) => setActionError(getErrorMessage(err)),
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

  const startInterest = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setActionError('');
    setNoteOpen(true);
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

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <span>👥 <strong className="font-semibold">{post.membersNeeded}</strong> members needed</span>
          {post.location && <span>📍 {post.location}</span>}
          {deadline && <span>🗓️ Apply by {deadline}</span>}
          {post.interestCount > 0 && (
            <span>
              🙋 <strong className="font-semibold">{post.interestCount}</strong> interested
            </span>
          )}
        </div>

        <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-700">{post.description}</p>

        {post.requiredSkills?.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Required skills</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {post.requiredSkills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        )}

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
        <div className="mt-8 border-t border-slate-100 pt-6">
          {actionError && (
            <div className="mb-4">
              <Alert variant="error">{actionError}</Alert>
            </div>
          )}

          {isOwner ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/posts/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          ) : post.status === 'closed' ? (
            <Button disabled>This opportunity is closed</Button>
          ) : post.hasExpressedInterest ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="green">✓ You&apos;re interested</Badge>
              <Button
                variant="ghost"
                size="sm"
                loading={withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate()}
              >
                Withdraw
              </Button>
            </div>
          ) : noteOpen ? (
            <div className="space-y-3">
              <Textarea
                rows={3}
                label="Add a note to the author (optional)"
                placeholder="Introduce yourself and say why you're a good fit…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button loading={expressMutation.isPending} onClick={() => expressMutation.mutate()}>
                  Send interest
                </Button>
                <Button variant="ghost" type="button" onClick={() => setNoteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="lg" onClick={startInterest}>
              I&apos;m interested
            </Button>
          )}
        </div>
      </Card>

      {/* Author-only: who's interested */}
      {isOwner && <InterestedStudents postId={id} />}
    </Container>
  );
}
