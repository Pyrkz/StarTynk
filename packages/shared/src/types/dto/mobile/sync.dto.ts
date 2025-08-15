export interface SyncRequestDTO {
  lastSyncAt?: string;
  entities: string[];
  deviceId: string;
}

export interface SyncResponseDTO {
  timestamp: string;
  changes: {
    created: Record<string, any[]>;
    updated: Record<string, any[]>;
    deleted: Record<string, string[]>;
  };
  hasMore: boolean;
  nextCursor?: string;
}

export interface SyncChangeDTO {
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  clientTimestamp: string;
}

export interface ConflictResolutionDTO {
  conflictId: string;
  resolution: 'client' | 'server' | 'merge';
  mergedData?: any;
}