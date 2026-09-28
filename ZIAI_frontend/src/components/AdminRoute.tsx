import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import type { ReactNode } from 'react';

export function AdminRoute({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    if (!user) return <>{children}</>;
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
