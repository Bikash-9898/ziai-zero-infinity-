// src/components/GuestGate.tsx
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/useAuth';
import { tokenStore } from '@/api/auth';

/**
 * Wraps a route that should work for BOTH signed-in users and anonymous
 * visitors. If there's no active session (no user + no JWT), it silently
 * provisions a lightweight guest session before rendering children — this
 * is what makes the /client/chat route usable without signing in.
 */
export default function GuestGate({ children }: { children: ReactNode }) {
  const { user, loginAsGuest } = useAuth();
  const [ready, setReady] = useState(!!user && !!tokenStore.get());
  const [error, setError] = useState(false);

  useEffect(() => {
    if (user && tokenStore.get()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    loginAsGuest()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        Couldn't start a chat session. Please refresh the page.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
