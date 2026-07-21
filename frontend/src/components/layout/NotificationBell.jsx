import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notificationApi';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/timeAgo';

const TYPE_ICON = { interest: '🙋', message: '💬', system: '✨' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: invalidate });

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openNotification = (n) => {
    setOpen(false);
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-lg px-2 py-2 text-lg text-slate-600 transition-colors hover:bg-slate-100"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                    !n.read && 'bg-brand-50/60'
                  )}
                >
                  {n.actor ? (
                    <Avatar name={n.actor.name} src={n.actor.avatar} size="sm" />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-base">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm text-slate-700', !n.read && 'font-medium text-slate-900')}>
                      {n.text}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
