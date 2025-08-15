import { EntityType } from '../../enums';

export interface CommentDTO {
  id: string;
  content: string;
  authorId: string;
  author?: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  entityType: EntityType;
  entityId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDTO {
  content: string;
  entityType: EntityType;
  entityId: string;
}

export interface UpdateCommentDTO {
  content: string;
}