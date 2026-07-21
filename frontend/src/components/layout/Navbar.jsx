import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Container } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { conversationApi } from '@/api/conversationApi';
import { cn } from '@/utils/cn';
import Logo from './Logo';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';

// Primary nav links.
const NAV_LINKS = [{ label: 'Browse', to: '/browse' }];

/** Messages link with a live unread badge. */
function MessagesLink() {
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationApi.list,
  });
  const unread = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

  return (
    <NavLink
      to="/chat"
      className={({ isActive }) =>
        cn(
          'relative rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
          isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
        )
      }
      aria-label="Messages"
    >
      <span className="text-lg" aria-hidden>💬</span>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth-aware actions. Render nothing while the session is resolving to
            avoid a flash of the wrong state. */}
        <div className="flex items-center gap-2">
          {isLoading ? null : isAuthenticated ? (
            <>
              <NotificationBell />
              <MessagesLink />
              <Link to="/posts/new" className="hidden sm:block">
                <Button size="sm">+ Create</Button>
              </Link>
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
