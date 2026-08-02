// src/components/GuestGate.tsx
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/useAuth';

/**
 * Wraps a route that should work for both signed-in users and anonymous visitors.
 * If no user is logged in, prompts to continue as guest (creates a guest session).
 */
export default function GuestGate({ children }: { children: ReactNode }) {
  const { user, loginAsGuest, loading } = useAuth();
  const [error, setError] = useState(false);
  const [isGuestStarting, setIsGuestStarting] = useState(false);

  // If user is already logged in (any type), render children
  if (user) {
    return <>{children}</>;
  }

  const handleGuestLogin = async () => {
    setError(false);
    setIsGuestStarting(true);
    try {
      await loginAsGuest();
    } catch {
      setError(true);
    } finally {
      setIsGuestStarting(false);
    }
  };

  // Show spinner while loading (either initial auth check or guest login in progress)
  if (loading || isGuestStarting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-400">
        <p>Couldn't start a guest session. Please try again.</p>
        <button
          onClick={handleGuestLogin}
          className="px-5 py-3 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition"
        >
          Retry Guest Login
        </button>
      </div>
    );
  }

  // No user → show “Continue as Guest” prompt
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center text-white">
      <div className="max-w-xl space-y-3">
        <h2 className="text-2xl font-semibold">Continue as Guest</h2>
        <p className="text-sm text-slate-400">
          You can use the chat in guest mode. No personal data is stored.
        </p>
      </div>
      <button
        onClick={handleGuestLogin}
        className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition"
      >
        Continue as Guest
      </button>
    </div>
  );
}