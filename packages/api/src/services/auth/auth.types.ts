export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    profilePicture?: string | null;
  };
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  deviceId?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}