import { UserSessionDTO } from '../user';

/**
 * Session check request DTO
 */
export interface SessionCheckRequestDTO {
  sessionId?: string;
  includeUser?: boolean;
}

/**
 * Session check response DTO
 */
export interface SessionCheckResponseDTO {
  valid: boolean;
  session?: SessionInfoDTO;
  user?: UserSessionDTO;
}

/**
 * Session info DTO
 */
export interface SessionInfoDTO {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Active sessions list DTO
 */
export interface ActiveSessionsDTO {
  sessions: SessionInfoDTO[];
  currentSessionId: string;
}

/**
 * Terminate session request DTO
 */
export interface TerminateSessionRequestDTO {
  sessionId: string;
}

/**
 * Terminate all sessions request DTO
 */
export interface TerminateAllSessionsRequestDTO {
  exceptCurrent?: boolean;
}