import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '@/api/conversationApi';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Spinner } from '@/components/ui';
import { cn } from '@/utils/cn';

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function MessageThread({ conversationId, onBack }) {
  const { socket, isOnline } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherRead, setOtherRead] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const { data: conversations } = useQuery({ queryKey: ['conversations'], queryFn: conversationApi.list });
  const other = conversations?.find((c) => c.id === conversationId)?.other;

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationApi.messages(conversationId),
  });
  const messages = data?.messages ?? [];

  // Scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, otherTyping]);

  // Mark the conversation read when opened / when new messages arrive.
  // Invalidate the list AFTER the server acks, so the unread count is accurate.
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:read', { conversationId }, () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [socket, conversationId, messages.length, queryClient]);

  // Live socket events for THIS conversation.
  useEffect(() => {
    if (!socket) return undefined;

    const onNew = ({ conversationId: cid, message }) => {
      if (cid !== conversationId) return;
      queryClient.setQueryData(['messages', conversationId], (old) => {
        const list = old?.messages ?? [];
        if (list.some((m) => m.id === message.id)) return old; // de-dupe echo
        return { ...(old ?? { hasMore: false }), messages: [...list, message] };
      });
      if (message.sender.id === user.id) setOtherRead(false); // my new msg isn't read yet
    };
    const onTyping = ({ conversationId: cid, typing }) => {
      if (cid === conversationId) setOtherTyping(typing);
    };
    const onRead = ({ conversationId: cid, by }) => {
      if (cid === conversationId && by !== user.id) setOtherRead(true);
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('conversation:read', onRead);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('conversation:read', onRead);
    };
  }, [socket, conversationId, user.id, queryClient]);

  const emitTyping = (typing) => {
    if (socket && other) socket.emit('typing', { conversationId, toUserId: other.id, typing });
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !socket) return;
    socket.emit('message:send', { conversationId, text });
    setDraft('');
    emitTyping(false);
    clearTimeout(typingTimer.current);
  };

  const lastMine = [...messages].reverse().find((m) => m.sender.id === user.id);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="md:hidden text-slate-500 hover:text-slate-900">
            ←
          </button>
        )}
        {other && (
          <>
            <div className="relative">
              <Avatar name={other.name} src={other.avatar} size="sm" />
              {isOnline(other.id) && (
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>
            <div>
              <Link to={`/profile/${other.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                {other.name}
              </Link>
              <p className="text-xs text-slate-400">{isOnline(other.id) ? 'Active now' : 'Offline'}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
        {isLoading ? (
          <div className="grid h-full place-items-center text-brand-600">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-slate-400">
            No messages yet. Say hello 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === user.id;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                    mine ? 'bg-brand-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <span className={cn('mt-1 block text-[10px]', mine ? 'text-brand-100' : 'text-slate-400')}>
                    {formatTime(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Read receipt under my last message */}
        {otherRead && lastMine && (
          <p className="pr-1 text-right text-[11px] text-slate-400">Read</p>
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-3.5 py-2 text-sm text-slate-400 shadow-sm">
              typing…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          value={draft}
          onChange={handleChange}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
