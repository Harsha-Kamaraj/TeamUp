import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { dashboardApi } from '@/api/dashboardApi';
import { postApi } from '@/api/postApi';
import { useAuth } from '@/contexts/AuthContext';
import { postTypeMeta } from '@/lib/postOptions';

/**
 * Which profile fields carry weight when someone decides whether to invite you.
 * Order matters — the first missing one becomes the suggested next step.
 */
const PROFILE_CHECKS = [
  { key: 'avatar', label: 'Add a profile photo', has: (u) => !!u.avatar },
  { key: 'college', label: 'Add your college', has: (u) => !!u.college },
  { key: 'skills', label: 'List your skills', has: (u) => (u.skills?.length ?? 0) > 0 },
  { key: 'bio', label: 'Write a short bio', has: (u) => !!u.bio },
  { key: 'links', label: 'Link GitHub or LinkedIn', has: (u) => !!(u.links?.github || u.links?.linkedin) },
];

function ProfileStrength({ user }) {
  const done = PROFILE_CHECKS.filter((c) => c.has(user));
  const missing = PROFILE_CHECKS.filter((c) => !c.has(user));
  const pct = Math.round((done.length / PROFILE_CHECKS.length) * 100);

  if (missing.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-slate-900">Profile strength</h2>
        <span className="text-[13px] font-semibold text-brand-600">{pct}%</span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-brand-gradient h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">
        Your skills decide which opportunities we recommend — the more complete your profile, the
        better the matches.
      </p>

      <ul className="mt-3.5 space-y-2">
        {missing.slice(0, 3).map((c) => (
          <li key={c.key}>
            <Link
              to="/settings/profile"
              className="flex items-center justify-between gap-2 text-[13px] text-slate-600 transition-colors hover:text-brand-700"
            >
              {c.label}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivityStats() {
  const { data } = useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.getStats });
  const s = data?.stats;
  if (!s) return null;

  const rows = [
    { label: 'Posts', value: s.postsCount },
    { label: 'Interest received', value: s.interestsReceived },
    { label: 'Interest sent', value: s.interestsSent },
  ];

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
          <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
          Your activity
        </h2>
        <Link to="/dashboard" className="text-slate-300 transition-colors hover:text-brand-600">
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <dl className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[13px] text-slate-500">{r.label}</dt>
            <dd className="text-[15px] font-semibold text-slate-900">{r.value ?? 0}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Open opportunities matching the viewer's skills — the reason to come back. */
function MatchingOpportunities({ user }) {
  const skill = user?.skills?.[0];
  const { data } = useQuery({
    queryKey: ['matching-posts', skill],
    queryFn: () => postApi.list({ search: skill, limit: 4 }),
    enabled: !!skill,
  });

  const posts = (data?.posts ?? []).filter((p) => p.author?.id !== user.id).slice(0, 3);
  if (!skill || posts.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
        <Sparkles className="h-3.5 w-3.5 text-slate-400" />
        Matches your skills
      </h2>

      <ul className="mt-3 space-y-3.5">
        {posts.map((p) => {
          const meta = postTypeMeta(p);
          return (
            <li key={p.id}>
              <Link to={`/posts/${p.id}`} className="group block">
                <p className="text-[13px] leading-snug font-medium text-slate-800 group-hover:text-brand-700">
                  {p.title}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  {meta.label} · {p.membersNeeded} needed
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * FeedSidebar — right rail. Everything here is derived from data the app
 * already has, so it stays accurate without extra services or cost.
 */
export default function FeedSidebar() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <aside className="sticky top-20 hidden xl:block">
        <section className="rounded-xl border border-slate-200 p-4">
          <h2 className="text-[13px] font-semibold text-slate-900">New to Squadly?</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Browse freely. Sign up when you want to post an opportunity or message someone.
          </p>
          <Link
            to="/login"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Log in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </aside>
    );
  }

  return (
    <aside className="sticky top-20 hidden space-y-4 xl:block">
      <ProfileStrength user={user} />
      <ActivityStats />
      <MatchingOpportunities user={user} />
    </aside>
  );
}
