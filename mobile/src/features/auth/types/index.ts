export type LoginMethod = 'phone' | 'email';

export interface LoginFormData {
  loginMethod: LoginMethod;
  phoneNumber: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}