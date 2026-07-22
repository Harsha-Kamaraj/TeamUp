import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, HandHeart, Star, MessageSquare, Plus } from 'lucide-react';
import { authApi } from '@/api/authApi';
import { dashboardApi } from '@/api/dashboardApi';
import { conversationApi } from '@/api/conversationApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Button, Card, Container } from '@/components/ui';
import StatCard from '@/components/dashboard/StatCard';
import MessageButton from '@/components/chat/MessageButton';
import { getErrorMessage } from '@/utils/getErrorMessage';

function VerifyEmailBanner() {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const resend = async () => {
    setState('sending');
    setError('');
    try {
      await authApi.resendVerification();
      setState('sent');
    } catch (err) {
      setState('error');
      setError(getErrorMessage(err));
    }
  };

  if (state === 'sent') {
    return (
      <Alert variant="success">
        Verification email sent — check your inbox (or the server console in development).
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-amber-800">
        <p className="font-semibold">Please verify your email address.</p>
        <p>Some features stay locked until you confirm your email.</p>
        {state === 'error' && <p className="mt-1 text-red-600">{error}</p>}
      </div>
      <Button variant="secondary" size="sm" loading={state === 'sending'} onClick={resend}>
        Resend email
      </Button>
    </div>
  );
}

function RecentActivity({ interests }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        Recent interest in your posts
      </h2>
      {interests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No one has expressed interest yet. Share your posts to get noticed! ✨
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {interests.map((it) => (
            <li key={it.id} className="flex items-start gap-3 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <Avatar name={it.fromUser?.name} src={it.fromUser?.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  <Link to={`/profile/${it.fromUser?.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {it.fromUser?.name}
                  </Link>{' '}
                  is interested in{' '}
                  <Link to={`/posts/${it.post?.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                    {it.post?.title}
                  </Link>
                </p>
                {it.message && <p className="mt-1 text-sm text-slate-500">“{it.message}”</p>}
              </div>
              <MessageButton userId={it.fromUser?.id} postId={it.post?.id} variant="outline" size="sm" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dash } = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats });
  const { data: conversations } = useQuery({ queryKey: ['conversations'], queryFn: conversationApi.list });

  const stats = dash?.stats;
  const recentInterests = dash?.recentInterests ?? [];
  const unread = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  const val = (n) => (stats ? n : '—');
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-1 text-slate-500">Here&apos;s what&apos;s happening with your team-building.</p>
      </div>

      {user && !user.isEmailVerified && (
        <div className="mb-6">
          <VerifyEmailBanner />
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Megaphone} label="My posts" value={val(stats?.postsCount)} to="/my-posts" />
        <StatCard icon={HandHeart} label="Interests received" value={val(stats?.interestsReceived)} to="/my-posts" />
        <StatCard icon={Star} label="Interests sent" value={val(stats?.interestsSent)} to="/my-interests" />
        <StatCard icon={MessageSquare} label="Unread messages" value={conversations ? unread : '—'} to="/chat" />
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/posts/new">
          <Button size="lg">
            <Plus className="h-4 w-4" /> Create a post
          </Button>
        </Link>
        <Link to="/browse">
          <Button size="lg" variant="outline">
            Explore Your Feed
          </Button>
        </Link>
        <Link to="/saved">
          <Button size="lg" variant="outline">
            Saved
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <RecentActivity interests={recentInterests} />
        </div>

        {/* Account */}
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} src={user?.avatar} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">{user?.name}</p>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className={user?.isEmailVerified ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'}>
                {user?.isEmailVerified ? 'Verified' : 'Unverified'}
              </dd>
            </div>
            {memberSince && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium text-slate-900">{memberSince}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Open posts</dt>
              <dd className="font-medium text-slate-900">{val(stats?.openPostsCount)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2">
            <Link to={`/profile/${user?.id}`}>
              <Button variant="outline" fullWidth size="sm">
                View my profile
              </Button>
            </Link>
            <Link to="/settings/profile">
              <Button variant="secondary" fullWidth size="sm">
                Edit profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}
