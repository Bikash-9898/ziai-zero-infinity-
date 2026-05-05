// Authentication context provider for React app
// Manages user state, login/logout functions, and persists auth info in localStorage
import { useState, useCallback, type ReactNode } from 'react';
import { AuthContext } from './context';
import { authApi } from '@/api/auth';
import type { User } from '@/types/types';

const STORAGE_KEY = 'zi_user'; // one constant, used everywhere

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (googleToken: string) => {
    setLoading(true);
    try {
      const data = await authApi.verifyGoogleToken(googleToken);
      if (data.verified) {
        setUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user)); // ✅ consistent key
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
    localStorage.removeItem(STORAGE_KEY); // ✅ consistent key
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}


// import { useState, type ReactNode } from 'react';
// import { AuthContext } from './context';
// import { authApi } from '@/api/auth';
// import type { User } from '@/types';

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(() => {
//     const savedUser = localStorage.getItem('zi_user');
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const [loading] = useState(false);

//   const login = async (token: string) => {
//     const data = await authApi.verifyGoogleToken(token);
//     if (data.verified) {
//       setUser(data.user);
//       localStorage.setItem('user', JSON.stringify(data.user));
//     }
//   };

//   // const login = async (googleToken: string) => {
//   //   setLoading(true);
//   //   try {
//   //     const { user } = await authApi.verifyGoogleToken(googleToken);
//   //     setUser(user);
//   //     localStorage.setItem('zi_user', JSON.stringify(user));
//   //   } catch (error) {
//   //     console.error('Login failed:', error);
//   //     throw error;
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('zi_user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }