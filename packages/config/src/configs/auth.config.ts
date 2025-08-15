import { EnvLoader } from '../env';
import type { AuthConfig } from '../types';

export function getAuthConfig(): AuthConfig {
  const env = EnvLoader.get();
  
  return {
    jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtExpiry: env.JWT_EXPIRY,
    jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY,
    nextAuthSecret: env.NEXTAUTH_SECRET,
    nextAuthUrl: env.NEXTAUTH_URL,
    bcryptRounds: env.BCRYPT_ROUNDS,
  };
}

export function getNextAuthConfig() {
  const authConfig = getAuthConfig();
  const env = EnvLoader.get();
  
  return {
    secret: authConfig.nextAuthSecret,
    url: authConfig.nextAuthUrl,
    jwt: {
      secret: authConfig.jwtSecret,
      maxAge: parseTimeString(authConfig.jwtExpiry),
    },
    session: {
      strategy: 'jwt' as const,
      maxAge: parseTimeString(authConfig.jwtRefreshExpiry),
      updateAge: 24 * 60 * 60, // 24 hours
    },
    pages: {
      signIn: '/auth/signin',
      signUp: '/auth/signup',
      error: '/auth/error',
      verifyRequest: '/auth/verify',
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (account && user) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.user = user;
        }
        return token;
      },
      async session({ session, token }) {
        session.accessToken = token.accessToken as string;
        session.user = token.user as any;
        return session;
      },
    },
    debug: env.isDevelopment,
  };
}

function parseTimeString(timeString: string): number {
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    case 'w': return value * 60 * 60 * 24 * 7;
    default: return 900; // 15 minutes default
  }
}