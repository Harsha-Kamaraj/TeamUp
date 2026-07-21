import { useNavigate, useParams } from 'react-router-dom';
import ConversationList from '@/components/chat/ConversationList';
import MessageThread from '@/components/chat/MessageThread';
import { Card, Container } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * ChatPage — two-pane messenger. On desktop, the conversation list and the
 * active thread show side by side; on mobile, the list gives way to the thread
 * when a conversation is open (with a back button).
 */
export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  return (
    <Container className="py-6">
      <Card className="overflow-hidden p-0">
        <div className="grid h-[calc(100svh-9rem)] min-h-[420px] grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div className={cn('border-r border-slate-100 md:block', conversationId ? 'hidden' : 'block')}>
            <ConversationList activeId={conversationId} />
          </div>

          {/* Active thread */}
          <div className={cn('min-w-0 md:block', conversationId ? 'block' : 'hidden md:block')}>
            {conversationId ? (
              <MessageThread conversationId={conversationId} onBack={() => navigate('/chat')} />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-slate-400">
                <div>
                  <div className="text-4xl">💬</div>
                  <p className="mt-2 text-sm">Select a conversation to start chatting.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Container>
  );
}
