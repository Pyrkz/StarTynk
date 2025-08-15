import { prisma } from '@/lib/prisma'

interface ActivityLogData {
  userId: string
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Tworzy log aktywności użytkownika
 */
export async function createUserActivityLog(data: ActivityLogData): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    })
  } catch (error) {
    // Nie przerywaj procesu autoryzacji jeśli logowanie się nie powiedzie
    console.error('Failed to create activity log:', error)
  }
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