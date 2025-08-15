import { cleanupExpiredTokens } from '../services/refresh.service';

/**
 * Setup periodic cleanup of expired tokens
 */
export function setupTokenCleanup(): void {
  let intervalId: NodeJS.Timeout;
  
  const runCleanup = async () => {
    try {
      const cleaned = await cleanupExpiredTokens();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired refresh tokens`);
      }
    } catch (error) {
      console.error('❌ Token cleanup failed:', error);
    }
  };
  
  // Run cleanup every hour
  intervalId = setInterval(runCleanup, 60 * 60 * 1000);
  
  // Run initial cleanup after 1 minute
  setTimeout(runCleanup, 60 * 1000);
  
  // Cleanup on process exit
  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('🔄 Token cleanup job stopped');
    }
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
  
  console.log('🚀 Token cleanup job started (runs every hour)');
}

/**
 * Run cleanup once (for scripts or manual cleanup)
 */
export async function runTokenCleanup(): Promise<number> {
  try {
    const cleaned = await cleanupExpiredTokens();
    console.log(`🧹 Cleaned up ${cleaned} expired refresh tokens`);
    return cleaned;
  } catch (error) {
    console.error('❌ Token cleanup failed:', error);
    throw error;
  }
}