import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessagesSquare } from 'lucide-react';
import { postApi } from '@/api/postApi';
import { conversationApi } from '@/api/conversationApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Badge, Button, Card, Input, Spinner } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

export default function TeamPanel({ postId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [naming, setNaming] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', postId],
    queryFn: () => postApi.getTeam(postId),
  });

  const createChat = useMutation({
    mutationFn: () => conversationApi.createTeam(postId, groupName),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${conversation.id}`);
    },
    onError: (err) => setError(getErrorMessage(err, 'Could not create the team chat.')),
  });

  if (isLoading) {
    return (
      <Card className="mt-6 grid place-items-center py-8 text-brand-600">
        <Spinner />
      </Card>
    );
  }
  if (!team) return null;

  const pct = team.needed > 0 ? Math.min(100, Math.round((team.count / team.needed) * 100)) : 0;
  const lead = team.members.find((m) => m.isAuthor);
  const isLead = !!user && lead?.id === user.id;
  const defaultName = `${lead?.name ?? 'My'}'s team`;

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Team</h2>
        <span className="text-sm font-semibold text-slate-900">
          {team.count}/{team.needed}{' '}
          {team.isFull && <span className="text-emerald-600">· Full</span>}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={team.isFull ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-brand-500'}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Members */}
      <div className="mt-4 flex flex-wrap gap-3">
        {team.members.map((m) => (
          <Link
            key={m.id}
            to={`/profile/${m.id}`}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pr-3 pl-1 hover:bg-slate-50"
          >
            <Avatar name={m.name} src={m.avatar} size="sm" />
            <span className="text-sm text-slate-700">{m.name}</span>
            {m.isAuthor && <Badge variant="brand">Lead</Badge>}
          </Link>
        ))}
      </div>

      {/* Missing skills */}
      {team.missingSkills.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm text-slate-500">Still looking for these skills:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {team.missingSkills.map((s) => (
              <Badge key={s} variant="amber">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> All required skills are covered.
        </p>
      )}

      {/* Team group chat — only the lead can start it, and only once there's
          actually someone else on the team. */}
      {isLead && team.count > 1 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          {error && (
            <div className="mb-3">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {naming ? (
            <div className="space-y-3">
              <Input
                label="Group name"
                placeholder={defaultName}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                hint={`Leave blank to use “${defaultName}”.`}
                maxLength={80}
              />
              <div className="flex flex-wrap gap-2">
                <Button loading={createChat.isPending} onClick={() => createChat.mutate()}>
                  <MessagesSquare className="h-4 w-4" />
                  Create group chat
                </Button>
                <Button variant="ghost" onClick={() => setNaming(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Start a group chat with all {team.count} team members.
              </p>
              <Button variant="secondary" onClick={() => setNaming(true)}>
                <MessagesSquare className="h-4 w-4" />
                Team chat
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
