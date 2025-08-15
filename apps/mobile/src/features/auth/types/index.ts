import { UserResponseDTO, LoginResponseDTO } from '@repo/shared/types';

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

// Map UserResponseDTO to local AuthUser for backward compatibility
export interface AuthUser extends UserResponseDTO {
  phoneNumber?: string; // Map from phone
  firstName?: string; // Extract from name
  lastName?: string; // Extract from name
  avatar?: string; // Map from image
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Use shared LoginResponseDTO
export type LoginResponse = LoginResponseDTO;