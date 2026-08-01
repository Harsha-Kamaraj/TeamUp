import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { conversationApi } from '@/api/conversationApi';
import { useSocket } from '@/contexts/SocketContext';
import { Users } from 'lucide-react';
import { Avatar, Spinner } from '@/components/ui';
import { cn } from '@/utils/cn';

export default function ConversationList({ activeId }) {
  const { isOnline } = useSocket();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationApi.list,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-bold text-slate-900">Messages</h2>
      </div>

      {isLoading ? (
        <div className="grid flex-1 place-items-center text-brand-600">
          <Spinner />
        </div>
      ) : !conversations?.length ? (
        <div className="grid flex-1 place-items-center p-6 text-center text-sm text-slate-400">
          No conversations yet. Message someone from a post to start one.
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                to={`/chat/${c.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50',
                  activeId === c.id && 'bg-brand-50 dark:bg-brand-500/15'
                )}
              >
                <div className="relative shrink-0">
                  {c.isGroup ? (
                    <span className="bg-brand-gradient grid h-10 w-10 place-items-center rounded-full text-white">
                      <Users className="h-5 w-5" />
                    </span>
                  ) : (
                    <>
                      <Avatar name={c.other?.name} src={c.other?.avatar} size="md" />
                      {c.other && isOnline(c.other.id) && (
                        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[color:var(--surface)] bg-emerald-500" />
                      )}
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900">
                      {c.isGroup ? c.name : (c.other?.name ?? 'Unknown')}
                      {c.isGroup && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">
                          {c.members?.length} members
                        </span>
                      )}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className={cn('truncate text-sm', c.unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500')}>
                    {c.lastMessage?.text ?? 'Say hi 👋'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
