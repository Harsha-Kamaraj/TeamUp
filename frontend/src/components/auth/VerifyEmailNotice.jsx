import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { Alert, Button } from '@/components/ui';

/**
 * Shown when an action was blocked because the account's email isn't confirmed.
 *
 * The API guard returns a plain 403, which on its own is a dead end — the user
 * is told to verify but given no way to do it. This sits the "verify" action
 * directly beside the message, wrapping underneath on narrow screens.
 */
export default function VerifyEmailNotice({ message }) {
  return (
    <Alert variant="error">
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>{message}</span>
        <Link to="/verify-email" className="shrink-0">
          <Button size="sm" variant="secondary">
            <MailCheck className="h-4 w-4" />
            Verify my email
          </Button>
        </Link>
      </span>
    </Alert>
  );
}
