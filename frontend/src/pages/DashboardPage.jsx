import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Button, Card, Container } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';

// Sections that get built out in later phases.
const UPCOMING = [
  { icon: '⭐', title: 'Saved Posts', body: 'Bookmarked opportunities — Phase 13.' },
  { icon: '🔔', title: 'Notifications', body: 'Interest & message alerts — Phase 12.' },
];

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

export default function DashboardPage() {
  const { user } = useAuth();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-1 text-slate-500">Here&apos;s your TeamUp home base.</p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/posts/new">
          <Button size="lg">+ Create an opportunity</Button>
        </Link>
        <Link to="/my-posts">
          <Button size="lg" variant="outline">
            My opportunities
          </Button>
        </Link>
        <Link to="/my-interests">
          <Button size="lg" variant="outline">
            My interests
          </Button>
        </Link>
        <Link to="/chat">
          <Button size="lg" variant="outline">
            Messages
          </Button>
        </Link>
      </div>

      {user && !user.isEmailVerified && (
        <div className="mb-6">
          <VerifyEmailBanner />
        </div>
      )}

      {/* Account summary */}
      <Card className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Account</h2>
          <div className="flex gap-2">
            <Link to={`/profile/${user?.id}`}>
              <Button variant="ghost" size="sm">
                View profile
              </Button>
            </Link>
            <Link to="/settings/profile">
              <Button variant="secondary" size="sm">
                Edit profile
              </Button>
            </Link>
          </div>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Name</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {user?.email}{' '}
              {user?.isEmailVerified ? (
                <span className="ml-1 text-xs font-semibold text-emerald-600">✓ verified</span>
              ) : (
                <span className="ml-1 text-xs font-semibold text-amber-600">unverified</span>
              )}
            </dd>
          </div>
          {memberSince && (
            <div>
              <dt className="text-xs text-slate-500">Member since</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{memberSince}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Coming soon */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {UPCOMING.map((item) => (
          <Card key={item.title} className="opacity-90">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">
              {item.icon}
            </div>
            <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.body}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
