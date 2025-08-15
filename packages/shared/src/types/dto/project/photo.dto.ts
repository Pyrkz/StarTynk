import { PhotoType, EntityType } from '../../enums';

export interface PhotoDTO {
  id: string;
  url: string;
  description?: string | null;
  type: PhotoType;
  entityType: EntityType;
  entityId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhotoDTO {
  url: string;
  description?: string;
  type: PhotoType;
  entityType: EntityType;
  entityId: string;
}

export interface UpdatePhotoDTO {
  description?: string | null;
  type?: PhotoType;
}