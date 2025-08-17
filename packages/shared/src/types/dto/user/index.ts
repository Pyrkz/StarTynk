/**
 * User DTOs
 */

export * from './user.dto';
export * from './create-user.dto';
export * from './update-user.dto';
export * from './user-response.dto';

// Alias for backward compatibility with mobile app
export type { UserDTO as UserResponseDTO } from './user.dto';

// Also export UnifiedUserDTO from auth types for easier migration
export type { UnifiedUserDTO as UnifiedUser } from '../auth/unified-auth.dto';