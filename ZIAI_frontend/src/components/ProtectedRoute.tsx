// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { tokenStore } from '@/api/auth';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Require both a user object in state AND a valid stored JWT
  if (!user || !tokenStore.get()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
