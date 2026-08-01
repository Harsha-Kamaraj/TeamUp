import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, FileText, Bookmark, MessageSquare, LayoutGrid, Users } from 'lucide-react';
import { conversationApi } from '@/api/conversationApi';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';

const LINKS = [
  { to: '/browse', label: 'Feed', icon: Compass, end: true },
  { to: '/my-posts', label: 'My posts', icon: FileText, auth: true },
  { to: '/library', label: 'Saved', icon: Bookmark, auth: true },
  { to: '/chat', label: 'Messages', icon: MessageSquare, auth: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, auth: true },
];

const FOOTER_LINKS = [
  { label: 'About', to: '/' },
  { label: 'Privacy', to: '/' },
  { label: 'Terms', to: '/' },
];

/**
 * FeedNav — persistent left rail on the feed.
 *
 * Primary navigation belongs somewhere always visible rather than buried in an
 * avatar dropdown; this is what makes the page read as a product rather than a
 * page. Hidden below `lg`, where the navbar already covers it.
 */
export default function FeedNav() {
  const { isAuthenticated, user } = useAuth();
  const links = LINKS.filter((l) => !l.auth || isAuthenticated);

  // Unread messages, shown as a badge on the Messages row. Shares the cache key
  // with the chat pages, so it stays in sync without a second request.
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationApi.list,
    enabled: isAuthenticated,
  });
  const unread = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  return (
    <nav className="sticky top-20 hidden lg:block">
      <ul className="space-y-0.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors',
                  isActive
                    ? 'bg-slate-100 font-semibold text-slate-900'
                    : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
              {to === '/chat' && unread > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {isAuthenticated && user && (
        <>
          <hr className="my-4 border-slate-200" />
          <Link
            to={`/profile/${user.id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
          >
            <Avatar name={user.name} src={user.avatar} size="xs" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium text-slate-800">
                {user.name}
              </span>
            </span>
          </Link>
        </>
      )}

      {!isAuthenticated && (
        <>
          <hr className="my-4 border-slate-200" />
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users className="h-4 w-4 text-brand-600" />
              Join Squadly
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Create an account to post opportunities and message students.
            </p>
            <Link
              to="/register"
              className="bg-brand-gradient mt-3 block rounded-lg px-3 py-2 text-center text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              Sign up free
            </Link>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1 px-3 text-[12px] text-slate-400">
        {FOOTER_LINKS.map((l) => (
          <Link key={l.label} to={l.to} className="hover:text-slate-600">
            {l.label}
          </Link>
        ))}
        <span className="w-full pt-1">© {new Date().getFullYear()} Squadly</span>
      </div>
    </nav>
  );
}
