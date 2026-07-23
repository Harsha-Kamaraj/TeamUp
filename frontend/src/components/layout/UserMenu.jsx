import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

function initialsOf(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * UserMenu — avatar button that opens a dropdown with the user's identity,
 * a link to the dashboard, and a logout action. Closes on outside-click / Esc.
 */
export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-slate-100"
      >
        <span className="bg-brand-gradient grid h-9 w-9 place-items-center overflow-hidden rounded-full text-sm font-semibold text-white">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(user.name)
          )}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:block">
          {user.name?.split(' ')[0]}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="bg-card absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 py-1 shadow-soft"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <Link
            to="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            to="/my-posts"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            My posts
          </Link>
          <Link
            to="/my-interests"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            My interests
          </Link>
          <Link
            to="/saved"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Saved
          </Link>
          <Link
            to={`/profile/${user.id}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            My profile
          </Link>
          <Link
            to="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit profile
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={cn(
              'block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50'
            )}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
