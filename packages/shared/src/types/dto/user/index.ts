/**
 * User DTOs
 */

export * from './user.dto';
export * from './create-user.dto';
export * from './update-user.dto';
export * from './user-response.dto';

// Alias for backward compatibility with mobile app
export type { UserDTO as UserResponseDTO } from './user.dto';

// Also export UnifiedUser from auth types for easier migration
export type { UnifiedUser } from '../../auth';