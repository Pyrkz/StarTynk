import { PhotoType } from '../enums';
import { User } from './user.types';

/**
 * Photo model for storing images
 */
export interface Photo {
  id: string;
  url: string;
  description: string | null;
  type: PhotoType;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Comment model for entity comments
 */
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  entityType: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  author?: User;
}

/**
 * Utility type for entities with timestamps
 */
export interface WithTimestamps {
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Utility type for soft deletable entities
 */
export interface SoftDeletable {
  deletedAt: Date | string | null;
}

/**
 * Utility type for active/inactive entities
 */
export interface Activatable {
  isActive: boolean;
}

/**
 * Base entity with common fields
 */
export interface BaseEntity extends WithTimestamps, SoftDeletable, Activatable {
  id: string;
}