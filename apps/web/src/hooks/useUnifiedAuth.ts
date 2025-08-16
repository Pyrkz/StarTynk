import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { getExtendedSession, getMobileSessionsForUser, revokeAllMobileSessions } from '../lib/auth/session-extension';

/**
 * Unified authentication hook for web app
 * Provides compatibility between NextAuth sessions and mobile JWT features
 */

interface UnifiedAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  security: {
    activeSessions: number;
    lastLoginAt?: Date;
    loginCount: number;
    canAccessMobile: boolean;
  };
  mobileSessions: any[];
}

interface UnifiedAuthActions {
  refreshSession: () => Promise<void>;
  revokeAllMobile: () => Promise<boolean>;
  getMobileSessions: () => Promise<any[]>;
  signOut: () => Promise<void>;
}

export function useUnifiedAuth(): [UnifiedAuthState, UnifiedAuthActions] {
  const { data: session, status, update } = useSession();
  const [mobileSessions, setMobileSessions] = useState<any[]>([]);
  const [isLoadingMobile, setIsLoadingMobile] = useState(false);

  // Build unified auth state
  const authState: UnifiedAuthState = {
    isAuthenticated: status === 'authenticated' && !!session,
    isLoading: status === 'loading' || isLoadingMobile,
    user: session?.user || null,
    security: {
      activeSessions: mobileSessions.length + (session ? 1 : 0), // Include current web session
      lastLoginAt: undefined, // TODO: Get from extended session
      loginCount: 0, // TODO: Get from extended session
      canAccessMobile: !!session,
    },
    mobileSessions,
  };

  // Refresh session data
  const refreshSession = useCallback(async () => {
    try {
      await update();
      
      if (session?.user?.id) {
        setIsLoadingMobile(true);
        const sessions = await getMobileSessionsForUser(session.user.id);
        setMobileSessions(sessions);
      }
    } catch (error) {
      console.error('❌ Failed to refresh session:', error);
    } finally {
      setIsLoadingMobile(false);
    }
  }, [session?.user?.id, update]);

  // Revoke all mobile sessions
  const revokeAllMobile = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      const success = await revokeAllMobileSessions(session.user.id);
      
      if (success) {
        setMobileSessions([]);
        console.log('✅ All mobile sessions revoked');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to revoke mobile sessions:', error);
      return false;
    }
  }, [session?.user?.id]);

  // Get current mobile sessions
  const getMobileSessions = useCallback(async (): Promise<any[]> => {
    if (!session?.user?.id) {
      return [];
    }

    try {
      setIsLoadingMobile(true);
      const sessions = await getMobileSessionsForUser(session.user.id);
      setMobileSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('❌ Failed to get mobile sessions:', error);
      return [];
    } finally {
      setIsLoadingMobile(false);
    }
  }, [session?.user?.id]);

  // Sign out (NextAuth)
  const signOut = useCallback(async () => {
    const { signOut } = await import('next-auth/react');
    await signOut();
  }, []);

  // Load mobile sessions on mount
  useEffect(() => {
    if (session?.user?.id && mobileSessions.length === 0) {
      getMobileSessions();
    }
  }, [session?.user?.id, getMobileSessions, mobileSessions.length]);

  const actions: UnifiedAuthActions = {
    refreshSession,
    revokeAllMobile,
    getMobileSessions,
    signOut,
  };

  return [authState, actions];
}

/**
 * Hook for admin impersonation features
 */
export function useImpersonation() {
  const { data: session } = useSession();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  // Check if current user is admin
  const canImpersonate = session?.user?.role === 'ADMIN';

  // Start impersonation
  const startImpersonation = useCallback(async (userId: string): Promise<boolean> => {
    if (!canImpersonate || !session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: session.user.id,
          targetUserId: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsImpersonating(true);
        setTargetUser(data.targetUser);
        console.log('🎭 Impersonation started');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to start impersonation:', error);
      return false;
    }
  }, [canImpersonate, session?.user?.id]);

  // End impersonation
  const endImpersonation = useCallback(async (): Promise<boolean> => {
    if (!isImpersonating || !session?.user?.id || !targetUser) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/end-impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: session.user.id,
          targetUserId: targetUser.id,
        }),
      });

      if (response.ok) {
        setIsImpersonating(false);
        setTargetUser(null);
        console.log('🎭 Impersonation ended');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to end impersonation:', error);
      return false;
    }
  }, [isImpersonating, session?.user?.id, targetUser]);

  return {
    canImpersonate,
    isImpersonating,
    targetUser,
    startImpersonation,
    endImpersonation,
  };
}

/**
 * Hook for security management
 */
export function useSecurityManagement() {
  const { data: session } = useSession();
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get security events for current user
  const getSecurityEvents = useCallback(async (): Promise<any[]> => {
    if (!session?.user?.id) {
      return [];
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/security-events');
      
      if (response.ok) {
        const events = await response.json();
        setSecurityEvents(events);
        return events;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to get security events:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Report security incident
  const reportSecurityIncident = useCallback(async (incident: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/security-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          ...incident,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to report security incident:', error);
      return false;
    }
  }, [session?.user?.id]);

  return {
    securityEvents,
    isLoading,
    getSecurityEvents,
    reportSecurityIncident,
  };
}