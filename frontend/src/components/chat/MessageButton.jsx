import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '@/api/conversationApi';
import { Button } from '@/components/ui';
import { getErrorMessage, needsEmailVerification } from '@/utils/getErrorMessage';

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
    } catch (error) {
      setLoading(false);
      // This button renders inline with no room for an alert, so an unverified
      // user would just see it stop with no explanation. Send them straight to
      // the page that can fix it.
      if (needsEmailVerification(getErrorMessage(error))) navigate('/verify-email');
    }
  };

  return (
    <Button loading={loading} onClick={start} {...props}>
      {children}
    </Button>
  );
}
