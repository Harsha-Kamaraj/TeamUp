import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import { Button, Container } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { conversationApi } from '@/api/conversationApi';
import { cn } from '@/utils/cn';
import Logo from './Logo';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

// Primary nav links.
const NAV_LINKS = [{ label: 'Your Feed', to: '/browse' }];

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
          'relative rounded-lg p-2 transition-colors',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        )
      }
      aria-label="Messages"
    >
      <MessageSquare className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
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
    <header className="bg-card-blur sticky top-0 z-40 border-b border-slate-200 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Auth-aware actions. Render nothing while the session is resolving to
            avoid a flash of the wrong state. */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {isLoading ? null : isAuthenticated ? (
            <>
              <NotificationBell />
              <MessagesLink />
              <Link to="/posts/new" className="hidden sm:block">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Create post
                </Button>
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
