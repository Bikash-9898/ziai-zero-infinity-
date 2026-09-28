// src/context/authContext.tsx
import { useState, useCallback, type ReactNode, useEffect } from 'react';
import { AuthContext } from './context';
import { authApi, tokenStore } from '@/api/auth';
import type { User } from '@/types/types';
import { ADMIN_USER_KEY, USER_KEY } from '@/config';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
                    ?? localStorage.getItem(ADMIN_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (googleAccessToken: string) => {
    setLoading(true);
    try {
      // Backend now returns { verified, access_token, user }
      // authApi.verifyGoogleToken stores the JWT automatically via tokenStore
      const data = await authApi.verifyGoogleToken(googleAccessToken);
      if (data.verified) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-provision (or resume) a guest session — no sign-in required.
  // client_guest_id is stable per browser via localStorage, so reloading
  // the page or coming back later resumes the same guest identity/trial
  // instead of minting a brand new one each time.
  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    try {
      let guestId = localStorage.getItem('zi_guest_id');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('zi_guest_id', guestId);
      }
      const data = await authApi.guestLogin(guestId);
      if (data.verified) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    tokenStore.clear();           // ← clear JWT on logout
  }, []);

  // Refresh user from backend — syncs plan and profile changes
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      const freshUser = data.user ?? data; // handle both { user } and flat response
      if (freshUser?.id) {
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Refresh on app mount so plan is always up to date after page reload
  useEffect(() => {
    if (!tokenStore.get()) return;
    // Wrap in inner async fn — avoids calling setState synchronously in effect body
    const sync = async () => {
      try {
        const data = await authApi.getMe();
        const freshUser = data.user ?? data;
        if (freshUser?.id) {
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        }
      } catch {
        // Token may be expired — silently ignore, user stays as loaded from localStorage
      }
    };
    void sync();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsGuest, logout, setUser , refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
