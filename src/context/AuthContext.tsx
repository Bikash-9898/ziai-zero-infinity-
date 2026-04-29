// import { useState, type ReactNode } from 'react';
// import { AuthContext } from './context';
// import { authApi } from '../api/auth';
// import type { User } from '../types';

// export function AuthProvider({ children }: { children: ReactNode }) {
//   // Lazy initialization - runs only once during initial render
//   const [user, setUser] = useState<User | null>(() => {
//     const savedUser = localStorage.getItem('zi_user');
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const [loading, setLoading] = useState(false);

//   const login = async (googleToken: string) => {
//     setLoading(true);
//     try {
//       const { user } = await authApi.verifyGoogleToken(googleToken);
//       setUser(user);
//       localStorage.setItem('zi_user', JSON.stringify(user));
//     } catch (error) {
//       console.error("Login failed:", error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

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

// // export function useAuth() {
// //   const context = useContext(AuthContext);
// //   if (!context) throw new Error('useAuth must be used within AuthProvider');
// //   return context;
// // }




import { useState, type ReactNode } from 'react';
import { AuthContext } from './context';
import { authApi } from '../api/auth';
import type { User } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('zi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (googleToken: string) => {
    setLoading(true);
    try {
      const { user } = await authApi.verifyGoogleToken(googleToken);
      setUser(user);
      localStorage.setItem('zi_user', JSON.stringify(user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('zi_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}