import { Role, ClientType } from '../enums';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  sessionId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface AuthContext {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTClaims {
  sub: string;
  email?: string;
  phone?: string;
  role: Role;
  iat: number;
  exp: number;
  jti?: string;
  clientType?: ClientType;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  userId?: string;
  role?: Role;
}

export interface IAuthProvider {
  login(credentials: AuthCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  refresh(): Promise<AuthSession>;
  verify(): Promise<boolean>;
  getSession(): Promise<AuthSession | null>;
}