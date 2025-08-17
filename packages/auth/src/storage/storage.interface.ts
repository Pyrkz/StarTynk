export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  organizationId?: string | null;
}

export abstract class AuthStorage {
  abstract getTokens(): Promise<AuthTokens | null>;
  abstract setTokens(tokens: AuthTokens): Promise<void>;
  abstract removeTokens(): Promise<void>;
  
  abstract getUser(): Promise<StoredUser | null>;
  abstract setUser(user: StoredUser): Promise<void>;
  abstract removeUser(): Promise<void>;
  
  abstract clear(): Promise<void>;
}