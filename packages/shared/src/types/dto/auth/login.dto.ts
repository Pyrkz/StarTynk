import { LoginMethod, ClientType } from '../../enums';
import type { UserDTO } from '../user';

/**
 * Login request DTO
 */
export interface LoginRequestDTO {
  identifier: string;  // email or phone
  password: string;
  loginMethod?: LoginMethod;
  clientType?: ClientType;
  deviceId?: string;
  rememberMe?: boolean;
}

/**
 * Login request type with required rememberMe for service consistency
 */
export interface LoginRequestDTOWithDefaults {
  identifier: string;
  password: string;
  loginMethod?: LoginMethod;
  clientType?: ClientType;
  deviceId?: string;
  rememberMe: boolean;
}

/**
 * Login response DTO
 */
export interface LoginResponseDTO {
  success: boolean;
  user: UserDTO;
  // For mobile
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  // For web
  sessionId?: string;
  redirectUrl?: string;
}

/**
 * Refresh token request DTO
 */
export interface RefreshTokenRequestDTO {
  refreshToken: string;
  deviceId?: string;
}

/**
 * Refresh token response DTO
 */
export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Logout request DTO
 */
export interface LogoutRequestDTO {
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  everywhere?: boolean; // Logout from all devices
}

/**
 * Logout response DTO
 */
export interface LogoutResponseDTO {
  success: boolean;
  message: string;
}