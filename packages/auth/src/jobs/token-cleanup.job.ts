import { tokenService } from '../services/jwt.service';
import { getAuthConfig } from '../config';
import type { PlatformInterval } from '@repo/shared/types';

/**
 * Scheduled job to clean up expired tokens and maintain database health
 */
export class TokenCleanupJob {
  private intervalId: PlatformInterval | null = null;

  /**
   * Start the cleanup job with configurable interval
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Token cleanup job is already running');
      return;
    }

    const config = getAuthConfig();
    
    console.log(`🧹 Starting token cleanup job (interval: ${config.tokenCleanupInterval}ms)`);
    
    // Run immediately on start
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, config.tokenCleanupInterval);
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Token cleanup job stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  private async runCleanup(): Promise<void> {
    try {
      const deletedCount = await tokenService.cleanupExpiredTokens();
      
      if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} expired/revoked tokens`);
      }
      
      // Additional maintenance tasks
      await this.performMaintenanceTasks();
      
    } catch (error) {
      console.error('❌ Token cleanup job failed:', error);
    }
  }

  /**
   * Perform additional maintenance tasks
   */
  private async performMaintenanceTasks(): Promise<void> {
    // Log cleanup statistics for monitoring
    console.log('✅ Token cleanup completed successfully');
  }

  /**
   * Manual cleanup trigger for testing or immediate cleanup
   */
  async runManualCleanup(): Promise<number> {
    return tokenService.cleanupExpiredTokens();
  }
}

// Export singleton instance
export const tokenCleanupJob = new TokenCleanupJob();