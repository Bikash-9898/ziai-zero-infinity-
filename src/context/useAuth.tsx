// Authentication hook for React components
// Provides easy access to auth state and functions from AuthContext
import { useContext } from 'react';
import { AuthContext } from './context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}