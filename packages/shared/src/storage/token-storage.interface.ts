/**
 * Token storage interface for managing authentication tokens
 */
export interface TokenStorageInterface {
  /**
   * Save tokens to storage
   */
  saveTokens(data: TokenData): Promise<void>;
  
  /**
   * Get access token
   */
  getAccessToken(): Promise<string | null>;
  
  /**
   * Get refresh token
   */
  getRefreshToken(): Promise<string | null>;
  
  /**
   * Get all token data
   */
  getTokenData(): Promise<TokenData | null>;
  
  /**
   * Check if token is expired
   */
  isTokenExpired(): Promise<boolean>;
  
  /**
   * Clear all tokens
   */
  clearTokens(): Promise<void>;
  
  /**
   * Clear all data (tokens and user data)
   */
  clearAll(): Promise<void>;
}

/**
 * Token data structure
 */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Storage service interface for backward compatibility
 */
export interface StorageServiceInterface {
  // Basic storage operations
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Auth-specific methods
  setAuthToken(token: string): Promise<void>;
  getAuthToken(): Promise<string | null>;
  setUserData(user: any): Promise<void>;
  getUserData(): Promise<any | null>;
  clearAll(): Promise<void>;
}