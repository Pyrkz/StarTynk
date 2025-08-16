import { prisma } from '@repo/database';
import { diff } from 'deep-object-diff';
import merge from 'deepmerge';

export type ConflictResolutionStrategy = 'CLIENT_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL_RESOLVE';

export interface ConflictData {
  entityType: string;
  entityId: string;
  clientData: any;
  serverData: any;
  clientTimestamp: Date;
  serverTimestamp: Date;
  userId: string;
  deviceId: string;
}

export interface ResolutionResult {
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  explanation: string;
  requiresUserIntervention: boolean;
}

export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  
  private constructor() {}
  
  static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }
  
  async resolveConflict(conflict: ConflictData): Promise<ResolutionResult> {
    // Get default strategy for entity type
    const strategy = this.getDefaultStrategy(conflict.entityType);
    
    switch (strategy) {
      case 'CLIENT_WINS':
        return this.applyClientWins(conflict);
        
      case 'SERVER_WINS':
        return this.applyServerWins(conflict);
        
      case 'MERGE':
        return this.applyMergeStrategy(conflict);
        
      case 'MANUAL_RESOLVE':
        return this.requireManualResolution(conflict);
        
      default:
        return this.applyClientWins(conflict);
    }
  }
  
  private getDefaultStrategy(entityType: string): ConflictResolutionStrategy {
    const strategies: Record<string, ConflictResolutionStrategy> = {
      attendance: 'MERGE',
      task: 'MERGE',
      material: 'SERVER_WINS',
      payroll: 'SERVER_WINS',
      project: 'SERVER_WINS',
      user: 'SERVER_WINS',
    };
    
    return strategies[entityType] || 'CLIENT_WINS';
  }
  
  private async applyClientWins(conflict: ConflictData): Promise<ResolutionResult> {
    // Log the conflict
    await this.logConflict(conflict, 'CLIENT_WINS');
    
    return {
      strategy: 'CLIENT_WINS',
      resolvedData: conflict.clientData,
      explanation: 'Client data takes precedence - local changes preserved',
      requiresUserIntervention: false,
    };
  }
  
  private async applyServerWins(conflict: ConflictData): Promise<ResolutionResult> {
    // Log the conflict
    await this.logConflict(conflict, 'SERVER_WINS');
    
    return {
      strategy: 'SERVER_WINS',
      resolvedData: conflict.serverData,
      explanation: 'Server data takes precedence - local changes discarded',
      requiresUserIntervention: false,
    };
  }
  
  private async applyMergeStrategy(conflict: ConflictData): Promise<ResolutionResult> {
    const mergedData = await this.mergeData(conflict);
    
    // Log the conflict
    await this.logConflict(conflict, 'MERGE', mergedData);
    
    return {
      strategy: 'MERGE',
      resolvedData: mergedData,
      explanation: 'Data merged intelligently based on entity type and field rules',
      requiresUserIntervention: false,
    };
  }
  
  private async requireManualResolution(conflict: ConflictData): Promise<ResolutionResult> {
    // Log the conflict
    await this.logConflict(conflict, 'MANUAL_RESOLVE');
    
    // Store conflict for user resolution
    await this.storeUnresolvedConflict(conflict);
    
    return {
      strategy: 'MANUAL_RESOLVE',
      resolvedData: conflict.serverData, // Keep server data until user resolves
      explanation: 'Conflict requires manual resolution by user',
      requiresUserIntervention: true,
    };
  }
  
  private async mergeData(conflict: ConflictData): Promise<any> {
    const { entityType, clientData, serverData } = conflict;
    
    switch (entityType) {
      case 'attendance':
        return this.mergeAttendance(clientData, serverData);
        
      case 'task':
        return this.mergeTask(clientData, serverData);
        
      default:
        return this.genericMerge(clientData, serverData);
    }
  }
  
  private mergeAttendance(clientData: any, serverData: any): any {
    // For attendance, we prioritize client check-in/out times but keep server metadata
    return {
      ...serverData,
      ...clientData,
      // Specific field handling
      checkIn: this.selectEarlierTime(clientData.checkIn, serverData.checkIn),
      checkOut: this.selectLaterTime(clientData.checkOut, serverData.checkOut),
      hoursWorked: this.calculateHoursWorked(
        this.selectEarlierTime(clientData.checkIn, serverData.checkIn),
        this.selectLaterTime(clientData.checkOut, serverData.checkOut)
      ),
      notes: this.mergeNotes(clientData.notes, serverData.notes),
      updatedAt: new Date(),
    };
  }
  
  private mergeTask(clientData: any, serverData: any): any {
    // For tasks, merge status updates and progress
    const merged = {
      ...serverData,
      ...clientData,
      // Specific field handling
      status: this.selectMoreAdvancedStatus(clientData.status, serverData.status),
      completionRate: Math.max(
        clientData.completionRate || 0,
        serverData.completionRate || 0
      ),
      actualHours: (clientData.actualHours || 0) + (serverData.actualHours || 0),
      notes: this.mergeNotes(clientData.notes, serverData.notes),
      updatedAt: new Date(),
    };
    
    // Handle array fields
    if (clientData.materials && serverData.materials) {
      merged.materials = this.mergeMaterials(clientData.materials, serverData.materials);
    }
    
    return merged;
  }
  
  private genericMerge(clientData: any, serverData: any): any {
    // For generic entities, use deepmerge with custom array handling
    return merge(serverData, clientData, {
      arrayMerge: (target, source) => {
        // For arrays, combine unique items based on ID
        const combined = [...target];
        source.forEach((item: any) => {
          const existingIndex = combined.findIndex((t: any) => t.id === item.id);
          if (existingIndex >= 0) {
            combined[existingIndex] = merge(combined[existingIndex], item);
          } else {
            combined.push(item);
          }
        });
        return combined;
      },
    });
  }
  
  // Helper methods
  
  private selectEarlierTime(time1: any, time2: any): Date | null {
    if (!time1 && !time2) return null;
    if (!time1) return new Date(time2);
    if (!time2) return new Date(time1);
    
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return date1 < date2 ? date1 : date2;
  }
  
  private selectLaterTime(time1: any, time2: any): Date | null {
    if (!time1 && !time2) return null;
    if (!time1) return new Date(time2);
    if (!time2) return new Date(time1);
    
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    return date1 > date2 ? date1 : date2;
  }
  
  private calculateHoursWorked(checkIn: Date | null, checkOut: Date | null): number {
    if (!checkIn || !checkOut) return 0;
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  
  private selectMoreAdvancedStatus(status1: string, status2: string): string {
    const statusOrder = ['NEW', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'APPROVED', 'PAID'];
    const index1 = statusOrder.indexOf(status1);
    const index2 = statusOrder.indexOf(status2);
    
    if (index1 === -1) return status2;
    if (index2 === -1) return status1;
    
    return index1 > index2 ? status1 : status2;
  }
  
  private mergeNotes(notes1?: string, notes2?: string): string {
    if (!notes1 && !notes2) return '';
    if (!notes1) return notes2 || '';
    if (!notes2) return notes1;
    
    if (notes1 === notes2) return notes1;
    
    // Combine notes with timestamp
    const timestamp = new Date().toLocaleString();
    return `${notes2}\n\n--- Merged ${timestamp} ---\n${notes1}`;
  }
  
  private mergeMaterials(materials1: any[], materials2: any[]): any[] {
    const merged = [...materials2];
    
    materials1.forEach(material => {
      const existingIndex = merged.findIndex(m => m.materialId === material.materialId);
      if (existingIndex >= 0) {
        // Merge quantities and other fields
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...material,
          quantity: Math.max(
            merged[existingIndex].quantity || 0,
            material.quantity || 0
          ),
        };
      } else {
        merged.push(material);
      }
    });
    
    return merged;
  }
  
  private async logConflict(
    conflict: ConflictData,
    resolution: string,
    resolvedData?: any
  ): Promise<void> {
    await prisma.conflictLog.create({
      data: {
        userId: conflict.userId,
        deviceId: conflict.deviceId,
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        clientData: conflict.clientData,
        serverData: conflict.serverData,
        resolution,
        resolvedData,
      },
    });
  }
  
  private async storeUnresolvedConflict(conflict: ConflictData): Promise<void> {
    // Store in a separate table or mark in sync queue for user resolution
    await prisma.syncQueue.create({
      data: {
        userId: conflict.userId,
        deviceId: conflict.deviceId,
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        operation: 'UPDATE',
        payload: conflict.clientData,
        checksum: this.generateChecksum(conflict.clientData),
        status: 'CONFLICT',
        error: 'Manual resolution required',
        priority: 1, // High priority
      },
    });
  }
  
  private generateChecksum(data: any): string {
    // Simple checksum generation
    return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 32);
  }
  
  // Public API for manual resolution
  
  async getUnresolvedConflicts(userId: string): Promise<any[]> {
    const conflicts = await prisma.syncQueue.findMany({
      where: {
        userId,
        status: 'CONFLICT',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return conflicts;
  }
  
  async resolveManualConflict(
    conflictId: string,
    userId: string,
    resolution: 'KEEP_CLIENT' | 'KEEP_SERVER' | 'CUSTOM',
    customData?: any
  ): Promise<void> {
    const conflict = await prisma.syncQueue.findFirst({
      where: {
        id: conflictId,
        userId,
        status: 'CONFLICT',
      },
    });
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    // Apply resolution
    let resolvedData: any;
    switch (resolution) {
      case 'KEEP_CLIENT':
        resolvedData = conflict.payload;
        break;
      case 'KEEP_SERVER':
        // Mark as resolved without changes
        await prisma.syncQueue.delete({ where: { id: conflictId } });
        return;
      case 'CUSTOM':
        if (!customData) {
          throw new Error('Custom data required for custom resolution');
        }
        resolvedData = customData;
        break;
    }
    
    // Update sync queue with resolved data
    await prisma.syncQueue.update({
      where: { id: conflictId },
      data: {
        status: 'PENDING',
        payload: resolvedData,
        checksum: this.generateChecksum(resolvedData),
        error: null,
      },
    });
  }
  
  // Analyze conflicts for patterns
  async analyzeConflictPatterns(userId: string): Promise<{
    totalConflicts: number;
    byEntityType: Record<string, number>;
    byResolution: Record<string, number>;
    mostConflictedEntities: Array<{ entityId: string; count: number }>;
    recommendations: string[];
  }> {
    const conflicts = await prisma.conflictLog.findMany({
      where: { userId },
    });
    
    const byEntityType: Record<string, number> = {};
    const byResolution: Record<string, number> = {};
    const entityConflicts: Record<string, number> = {};
    
    conflicts.forEach(conflict => {
      // Count by entity type
      byEntityType[conflict.entityType] = (byEntityType[conflict.entityType] || 0) + 1;
      
      // Count by resolution
      byResolution[conflict.resolution] = (byResolution[conflict.resolution] || 0) + 1;
      
      // Count by specific entity
      const key = `${conflict.entityType}:${conflict.entityId}`;
      entityConflicts[key] = (entityConflicts[key] || 0) + 1;
    });
    
    // Get most conflicted entities
    const mostConflictedEntities = Object.entries(entityConflicts)
      .map(([entityId, count]) => ({ entityId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (byEntityType.attendance > conflicts.length * 0.5) {
      recommendations.push('Consider adjusting attendance sync frequency to reduce conflicts');
    }
    
    if (byResolution.MANUAL_RESOLVE > conflicts.length * 0.3) {
      recommendations.push('Many conflicts require manual resolution - consider reviewing sync strategies');
    }
    
    if (mostConflictedEntities[0]?.count > 10) {
      recommendations.push(`Entity ${mostConflictedEntities[0].entityId} has frequent conflicts - investigate the cause`);
    }
    
    return {
      totalConflicts: conflicts.length,
      byEntityType,
      byResolution,
      mostConflictedEntities,
      recommendations,
    };
  }
}

export const conflictResolutionService = ConflictResolutionService.getInstance();