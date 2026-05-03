import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import type { JSX } from 'react';

// export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Prevent flash of login screen
  // if (loading) return <div className="bg-black h-screen" />;

  if (!user) {
    // If not logged in, send them back to the landing page
    return <Navigate to="/" replace />;
  }

  // return <>{children}</>;
  return children;
};