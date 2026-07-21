import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '@/api/conversationApi';
import { Button } from '@/components/ui';

/**
 * MessageButton — starts (or opens the existing) conversation with `userId`
 * and navigates to it. Optionally records the `postId` that sparked it.
 */
export default function MessageButton({ userId, postId, children = 'Message', ...props }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const conversation = await conversationApi.start(userId, postId);
      navigate(`/chat/${conversation.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button loading={loading} onClick={start} {...props}>
      {children}
    </Button>
  );
}
