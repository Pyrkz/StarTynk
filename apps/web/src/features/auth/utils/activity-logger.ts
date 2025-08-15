import { prisma } from '@repo/database'

interface ActivityLogData {
  userId: string | null
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Create user activity log
 */
export async function logUserActivity(data: ActivityLogData): Promise<void> {
  try {
    // Only log if we have a user ID
    if (!data.userId) return;
    
    await prisma.userActivityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {}),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    })
  } catch (error) {
    // Don't break auth flow if logging fails
    console.error('Failed to create activity log:', error)
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function createUserActivityLog(data: ActivityLogData): Promise<void> {
  return logUserActivity(data);
}

/**
 * Sprawdza ostatnie nieudane próby logowania
 */
export async function checkRecentFailedAttempts(
  email: string,
  timeWindowMinutes: number = 15
): Promise<number> {
  try {
    const timeWindow = new Date()
    timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes)
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    
    if (!user) return 0
    
    const failedAttempts = await prisma.userActivityLog.count({
      where: {
        userId: user.id,
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: timeWindow
        }
      }
    })
    
    return failedAttempts
  } catch (error) {
    console.error('Failed to check recent failed attempts:', error)
    return 0
  }
}

/**
 * Sprawdza czy użytkownik jest zablokowany
 */
export async function isUserBlocked(email: string): Promise<boolean> {
  const maxAttempts = 5
  const failedAttempts = await checkRecentFailedAttempts(email, 15)
  
  return failedAttempts >= maxAttempts
}