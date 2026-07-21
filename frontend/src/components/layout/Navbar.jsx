import { Link, NavLink } from 'react-router-dom';
import { Button, Container } from '@/components/ui';
import { cn } from '@/utils/cn';
import Logo from './Logo';

// Primary nav links. (Destinations are built out in later phases.)
const NAV_LINKS = [
  { label: 'Browse', to: '/browse' },
  { label: 'How it works', to: '/how-it-works' },
];

export default function Navbar() {
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

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
