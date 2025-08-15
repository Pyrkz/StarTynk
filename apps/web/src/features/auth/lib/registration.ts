import { prisma } from '@repo/database'
import { hashPassword } from '../utils/password'
import { registerWithInviteSchema } from '../schemas/auth.schema'
import { createUserActivityLog } from '../utils/activity-logger'
import type { Role } from '@repo/database'

export async function handleRegistrationWithInvite(credentials: any) {
  try {
    // Walidacja danych
    const validatedData = registerWithInviteSchema.parse(credentials)
    
    // Sprawdź kod zaproszenia
    const invitation = await prisma.invitationCode.findUnique({
      where: { code: validatedData.invitationCode },
      include: { invitedBy: true }
    })
    
    if (!invitation) {
      await createUserActivityLog({
        userId: 'anonymous',
        action: 'REGISTRATION_FAILED',
        details: { reason: 'Invalid invitation code' }
      })
      return null
    }
    
    // Sprawdź czy kod nie wygasł
    if (invitation.expiresAt < new Date()) {
      await createUserActivityLog({
        userId: 'anonymous',
        action: 'REGISTRATION_FAILED',
        details: { reason: 'Invitation code expired' }
      })
      return null
    }
    
    // Sprawdź czy kod nie został już użyty
    if (invitation.usedAt) {
      await createUserActivityLog({
        userId: 'anonymous',
        action: 'REGISTRATION_FAILED',
        details: { reason: 'Invitation code already used' }
      })
      return null
    }
    
    // Sprawdź czy email się zgadza (jeśli jest określony w zaproszeniu)
    if (invitation.email && invitation.email.toLowerCase() !== validatedData.email.toLowerCase()) {
      await createUserActivityLog({
        userId: 'anonymous',
        action: 'REGISTRATION_FAILED',
        details: { reason: 'Email mismatch with invitation' }
      })
      return null
    }
    
    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })
    
    if (existingUser) {
      await createUserActivityLog({
        userId: existingUser.id,
        action: 'REGISTRATION_FAILED',
        details: { reason: 'User already exists' }
      })
      return null
    }
    
    // Hashuj hasło
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Utwórz użytkownika i oznacz kod jako użyty w transakcji
    const newUser = await prisma.$transaction(async (tx) => {
      // Utwórz użytkownika
      const user = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: invitation.role as Role,
          isActive: true,
          invitedBy: invitation.invitedById,
          lastLoginAt: new Date(),
          loginCount: 1
        }
      })
      
      // Oznacz kod jako użyty
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: {
          usedAt: new Date(),
          usedById: user.id
        }
      })
      
      // Loguj utworzenie konta
      await tx.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'ACCOUNT_CREATED',
          details: {
            invitationCode: invitation.code,
            invitedBy: invitation.invitedById
          }
        }
      })
      
      return user
    })
    
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      image: newUser.image
    }
    
  } catch (error) {
    console.error('Registration error:', error)
    return null
  }
}