import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuth as useBaseAuth } from '../useAuth';

/**
 * Web-specific auth hook that integrates with NextAuth
 * Provides compatibility layer between unified auth and NextAuth
 */
export function useWebAuth() {
  const baseAuth = useBaseAuth();
  const { data: session, status } = useSession();

  // Sync NextAuth session with unified auth store
  React.useEffect(() => {
    if (session?.user && !baseAuth.user) {
      baseAuth.setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role,
        emailVerified: true,
        phoneVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [session, baseAuth.user]);

  return {
    ...baseAuth,
    // NextAuth specific methods
    session,
    status,
    signIn,
    signOut,
  };
}