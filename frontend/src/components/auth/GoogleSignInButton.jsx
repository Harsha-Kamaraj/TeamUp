import { useEffect, useRef, useState } from 'react';
import { config } from '@/lib/config';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Load the Google Identity Services script once, shared across mounts. */
let scriptPromise = null;
function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = resolve;
    el.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * GoogleSignInButton — renders Google's own button and hands the resulting ID
 * token to `onCredential`.
 *
 * We use Google's rendered button rather than a custom one because Google's
 * terms require their official branding, and it handles the popup/FedCM flow.
 *
 * Renders nothing when VITE_GOOGLE_CLIENT_ID isn't set, so the app works
 * unchanged before Google is configured.
 */
export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const holder = useRef(null);
  const [failed, setFailed] = useState(false);
  // Keep the latest callback without re-initialising Google on every render.
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => {
    if (!config.googleClientId) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !holder.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => handler.current?.(response.credential),
        });
        window.google.accounts.id.renderButton(holder.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: holder.current.offsetWidth || 320,
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!config.googleClientId) return null;

  return (
    <div>
      {/* Google injects an iframe here; height reserved to avoid layout shift. */}
      <div ref={holder} className="flex min-h-[44px] w-full justify-center" />
      {failed && (
        <p className="mt-2 text-center text-sm text-slate-500">
          Google Sign-In could not load. Use your email and password instead.
        </p>
      )}
    </div>
  );
}
