import { createContext } from 'react';
import type { User } from '@/types/types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (googleToken: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void; 
  refreshUser: () => Promise<void>; // new method to refresh user data
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);