import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Users } from 'lucide-react';
import { userApi } from '@/api/userApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, Spinner } from '@/components/ui';

/**
 * FeedSearch — the bar at the top of the feed.
 *
 * Replaces the old "What are you building?" prompt, which only duplicated the
 * Create post button. Searching is what people actually arrive wanting to do,
 * and this covers the case the post filters can't: finding a *person*, then
 * seeing what they've posted.
 */
export default function FeedSearch({ value, onChange }) {
  const [people, setPeople] = useState(false);
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 300);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => userApi.search(debounced),
    enabled: people && debounced.trim().length >= 2,
  });
  const users = data ?? [];

  // Close the people dropdown on outside click.
  useEffect(() => {
    if (!people) return undefined;
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setPeople(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [people]);

  return (
    <div ref={boxRef} className="relative">
      <div className="bg-card flex items-center gap-2 rounded-xl border border-slate-200 p-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={people ? term : value}
            onChange={(e) => (people ? setTerm(e.target.value) : onChange(e.target.value))}
            placeholder={
              people ? 'Search students by name, college, or skill…' : 'Search opportunities…'
            }
            aria-label={people ? 'Search people' : 'Search opportunities'}
            className="w-full bg-transparent py-2 pr-8 pl-9 text-[14.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {(people ? term : value) && (
            <button
              type="button"
              onClick={() => (people ? setTerm('') : onChange(''))}
              aria-label="Clear"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Toggle between searching posts and searching students. */}
        <button
          type="button"
          onClick={() => setPeople((v) => !v)}
          aria-pressed={people}
          title="Search people instead"
          className={
            people
              ? 'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-[13px] font-medium text-white'
              : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }
        >
          <Users className="h-3.5 w-3.5" />
          People
        </button>
      </div>

      {/* People results */}
      {people && debounced.trim().length >= 2 && (
        <div className="bg-card absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 shadow-soft">
          {isFetching && (
            <div className="grid place-items-center py-6 text-brand-600">
              <Spinner size="sm" />
            </div>
          )}

          {!isFetching && users.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-slate-400">
              No students found for “{debounced}”.
            </p>
          )}

          <ul className="max-h-80 overflow-y-auto">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/profile/${u.id}`}
                  onClick={() => setPeople(false)}
                  className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-slate-900">
                      {u.name}
                    </span>
                    <span className="block truncate text-[12.5px] text-slate-500">
                      {[u.college, u.year].filter(Boolean).join(' · ') ||
                        u.skills?.slice(0, 3).join(', ') ||
                        'Student'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {users.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPeople(false);
                navigate(`/browse?q=${encodeURIComponent(debounced)}`);
              }}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-[13px] font-medium text-brand-600 hover:bg-slate-50"
            >
              Search opportunities for “{debounced}” instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
