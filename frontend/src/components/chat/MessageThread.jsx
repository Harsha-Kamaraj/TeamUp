import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Paperclip, Send, SmilePlus, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '@/api/conversationApi';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Avatar, Spinner } from '@/components/ui';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { cn } from '@/utils/cn';

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Must match ALLOWED_REACTIONS in backend/src/services/chat.service.js.
const REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

const formatSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/** Renders an image inline; anything else (PDFs) as a download card. */
function Attachment({ attachment, mine }) {
  const isImage = attachment.mime?.startsWith('image/');

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer noopener" className="mb-1.5 block">
        <img
          src={attachment.url}
          alt={attachment.name}
          loading="lazy"
          className="max-h-64 w-auto max-w-full rounded-xl object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'mb-1.5 flex items-center gap-2.5 rounded-xl border px-3 py-2 transition',
        mine
          ? 'border-white/25 bg-white/10 hover:bg-white/20'
          : 'border-slate-200 bg-card-2 hover:border-brand-300'
      )}
    >
      <FileText className={cn('h-5 w-5 shrink-0', mine ? 'text-white' : 'text-brand-500')} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{attachment.name}</span>
        <span className={cn('block text-[11px]', mine ? 'text-brand-100' : 'text-slate-400')}>
          {formatSize(attachment.size ?? 0)}
        </span>
      </span>
    </a>
  );
}

export default function MessageThread({ conversationId, onBack }) {
  const { socket, isOnline } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [pickerFor, setPickerFor] = useState(null); // message id whose picker is open
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null); // the scrollable message list
  const typingTimer = useRef(null);

  const { data: conversations } = useQuery({ queryKey: ['conversations'], queryFn: conversationApi.list });
  const conversation = conversations?.find((c) => c.id === conversationId);
  const other = conversation?.other;
  const isGroup = !!conversation?.isGroup;

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationApi.messages(conversationId),
  });
  const messages = data?.messages ?? [];

  // Scroll to the newest message.
  //
  // scrollIntoView() moves the nearest scrollable ancestor *and* the window, so
  // sending a message dragged the whole page down to the footer. Scroll the
  // message list's own container instead and leave the page where it is.
  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
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
    };
    const onTyping = ({ conversationId: cid, typing }) => {
      if (cid === conversationId) setOtherTyping(typing);
    };

    // Record the reader on every message in the cache, so "Seen by" is derived
    // from the same `readBy` data the server already stores — no separate
    // boolean that goes stale on reload.
    const onRead = ({ conversationId: cid, by }) => {
      if (cid !== conversationId || by === user.id) return;
      queryClient.setQueryData(['messages', conversationId], (old) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.readBy?.includes(by) ? m : { ...m, readBy: [...(m.readBy ?? []), by] }
          ),
        };
      });
    };

    const onReaction = ({ conversationId: cid, messageId, reactions }) => {
      if (cid !== conversationId) return;
      queryClient.setQueryData(['messages', conversationId], (old) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
        };
      });
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('conversation:read', onRead);
    socket.on('message:reaction', onReaction);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('conversation:read', onRead);
      socket.off('message:reaction', onReaction);
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

  const react = (messageId, emoji) => {
    socket?.emit('message:react', { messageId, emoji });
    setPickerFor(null);
  };

  /** Upload the file first, then send a message referencing it. */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again later
    if (!file || !socket) return;

    setUploadError('');
    setUploading(true);
    try {
      const attachment = await conversationApi.uploadAttachment(conversationId, file);
      socket.emit('message:send', { conversationId, text: draft.trim(), attachment });
      setDraft('');
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Could not upload that file.'));
    } finally {
      setUploading(false);
    }
  };

  const lastMine = [...messages].reverse().find((m) => m.sender.id === user.id);

  // Who has seen my most recent message (excluding me). Names come from the
  // conversation, so this works for both group and 1-on-1 threads.
  const seenBy = (() => {
    const readerIds = (lastMine?.readBy ?? []).filter((id) => id !== user.id);
    if (readerIds.length === 0) return [];
    const people = isGroup ? (conversation?.members ?? []) : other ? [other] : [];
    return readerIds
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .map((n) => n.split(' ')[0]);
  })();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="text-slate-500 hover:text-slate-900 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {conversation?.isGroup ? (
          <>
            <span className="bg-brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-white">
              <Users className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{conversation.name}</p>
              <p className="truncate text-xs text-slate-400">
                {conversation.members?.map((m) => m.name.split(' ')[0]).join(', ')}
              </p>
            </div>
          </>
        ) : (
          other && (
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
          )
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
        {isLoading ? (
          <div className="grid h-full place-items-center text-brand-600">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-slate-400">
            No messages yet. Say hello 👋
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender.id === user.id;
            // Group consecutive messages from one person (WhatsApp-style): the
            // name is shown once at the top of a run, the avatar once at the
            // bottom, so a burst reads as one block instead of repeating.
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const startsRun = !prev || prev.sender.id !== m.sender.id;
            const endsRun = !next || next.sender.id !== m.sender.id;

            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-2',
                  mine ? 'justify-end' : 'justify-start',
                  !startsRun && 'mt-0.5'
                )}
              >
                {/* Sender avatar — only on other people's messages, and only on
                    the last of a run so a burst isn't a column of avatars. */}
                {!mine && (
                  <span className="w-7 shrink-0">
                    {endsRun && (
                      <Link to={`/profile/${m.sender.id}`}>
                        <Avatar name={m.sender.name} src={m.sender.avatar} size="xs" />
                      </Link>
                    )}
                  </span>
                )}

                <div className="flex max-w-[75%] flex-col">
                  {/* Name only in groups — in a 1-on-1 it's obvious who's talking. */}
                  {!mine && isGroup && startsRun && (
                    <span className="mb-1 ml-1 text-xs font-semibold text-brand-600">
                      {m.sender.name}
                    </span>
                  )}
                  <div className="group/msg relative">
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2 text-sm',
                        mine ? 'bg-brand-600 text-white' : 'bg-card text-slate-800 shadow-sm'
                      )}
                    >
                      {m.attachment?.url && <Attachment attachment={m.attachment} mine={mine} />}
                      {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                      <span
                        className={cn(
                          'mt-1 block text-[10px]',
                          mine ? 'text-brand-100' : 'text-slate-400'
                        )}
                      >
                        {formatTime(m.createdAt)}
                      </span>
                    </div>

                    {/* React button — appears on hover/focus. */}
                    <button
                      type="button"
                      onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                      aria-label="Add reaction"
                      className={cn(
                        'bg-card absolute top-1 rounded-full border border-slate-200 p-1 text-slate-400 opacity-0 shadow-sm transition group-hover/msg:opacity-100 focus:opacity-100 hover:text-brand-600',
                        mine ? '-left-9' : '-right-9'
                      )}
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>

                    {pickerFor === m.id && (
                      <div
                        className={cn(
                          'bg-card absolute z-10 flex gap-0.5 rounded-full border border-slate-200 p-1 shadow-soft',
                          mine ? 'top-9 -left-2' : 'top-9 -right-2'
                        )}
                      >
                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => react(m.id, emoji)}
                            className="rounded-full px-1.5 py-0.5 text-base transition hover:bg-slate-100"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reaction pills, grouped by emoji with a count. */}
                  {m.reactions?.length > 0 && (
                    <div className={cn('mt-1 flex flex-wrap gap-1', mine && 'justify-end')}>
                      {Object.entries(
                        m.reactions.reduce((acc, r) => {
                          acc[r.emoji] = acc[r.emoji] ?? [];
                          acc[r.emoji].push(r.user);
                          return acc;
                        }, {})
                      ).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => react(m.id, emoji)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition',
                            users.includes(user.id)
                              ? 'border-brand-300 bg-brand-500/15 text-brand-700'
                              : 'bg-card border-slate-200 text-slate-500 hover:border-slate-300'
                          )}
                        >
                          <span className="text-xs">{emoji}</span>
                          {users.length > 1 && users.length}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Read receipt under my last message — names everyone who's seen it. */}
        {seenBy.length > 0 && (
          <p className="pr-1 text-right text-[11px] text-slate-400">
            Seen by {seenBy.length <= 3 ? seenBy.join(', ') : `${seenBy.slice(0, 2).join(', ')} +${seenBy.length - 2}`}
          </p>
        )}

        {/* Typing indicator */}
        {otherTyping && (
          // Indented by the same avatar gutter as incoming bubbles.
          <div className="flex items-end justify-start gap-2">
            <span className="w-7 shrink-0" />
            <div className="bg-card rounded-2xl px-3.5 py-2 text-sm text-slate-400 shadow-sm">
              typing…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 p-3">
        {uploadError && (
          <div className="mb-2">
            <Alert variant="error">{uploadError}</Alert>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Attach — images and PDFs only, matching the server allowlist. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Attach a file"
            title="Attach an image or PDF (max 8 MB)"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50"
          >
            {uploading ? <Spinner size="sm" /> : <Paperclip className="h-[18px] w-[18px]" />}
          </button>

          <input
            value={draft}
            onChange={handleChange}
            placeholder={uploading ? 'Uploading…' : 'Type a message…'}
            className="bg-card flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || uploading}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </form>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          Messages are automatically deleted after 30 days.
        </p>
      </div>
    </div>
  );
}
