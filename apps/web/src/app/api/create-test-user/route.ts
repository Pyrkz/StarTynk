import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { hashPassword } from '@/features/auth/utils/password'

export async function GET() {
  try {
    // Sprawdź czy testowy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    
    if (existingUser) {
      return NextResponse.json({
        message: 'Test user already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          isActive: existingUser.isActive
        }
      })
    }
    
    // Utwórz testowego użytkownika
    const hashedPassword = await hashPassword('password123')
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'ADMIN',
        isActive: true,
        lastLoginAt: new Date(),
        loginCount: 0
      }
    })
    
    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role
      },
      credentials: {
        email: 'test@example.com',
        password: 'password123'
      }
    })
    
  } catch (error: any) {
    console.error('Create test user error:', error)
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}