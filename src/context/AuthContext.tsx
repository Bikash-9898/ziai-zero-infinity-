// src/context/authContext.tsx
import { useState, useCallback, type ReactNode } from 'react';
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    tokenStore.clear();           // ← clear JWT on logout
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
