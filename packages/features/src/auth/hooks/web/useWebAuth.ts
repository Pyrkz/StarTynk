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

  // Sync NextAuth session with unified auth store - removed setUser as it doesn't exist
  React.useEffect(() => {
    // Session sync logic would be handled elsewhere
    if (session?.user && !baseAuth.user) {
      // Would need to implement user sync through different mechanism
      console.log('Session user available:', session.user);
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