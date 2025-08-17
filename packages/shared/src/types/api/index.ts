export * from './request.types';
export * from './response.types';
export * from './error.types';
export * from './pagination.types';

// Re-export commonly used DTOs for convenience
export type { UserDTO, UserListItemDTO, UserProfileDTO, UserSessionDTO } from '../dto/user/user.dto';
export type { CreateUserDTO, CreateUserResponseDTO, InviteUserDTO } from '../dto/user/create-user.dto';
export type { UpdateUserDTO, UpdateProfileDTO, UpdateUserResponseDTO } from '../dto/user/update-user.dto';
export type { UserFiltersDTO, ListUsersDTO, UserStatisticsDTO } from '../dto/user/user-response.dto';
export type { ProjectDTO } from '../dto/project/project.dto';
export type { SyncRequestDTO, SyncResponseDTO, SyncChangeDTO } from '../dto/mobile/sync.dto';

// Re-export auth DTOs for convenience
export type { LoginRequestDTO } from '../dto/auth/login.dto';
export type { 
  UnifiedLoginRequest,
  UnifiedRegisterRequest,
  UnifiedAuthResponse,
  UnifiedUserDTO,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SessionResponse,
  LogoutResponse,
  VerifyTokenResponse
} from '../dto/auth/unified-auth.dto';
export type { 
  TokenPayloadDTO,
  AuthTokensDTO
} from '../dto/auth/token.dto';

// Also add the UnifiedUser alias here for better discoverability
export type { UnifiedUserDTO as UnifiedUser } from '../dto/auth/unified-auth.dto';

// Add API response types
export type { ApiResponse, ApiErrorResponse, PaginatedResponse } from './response.types';