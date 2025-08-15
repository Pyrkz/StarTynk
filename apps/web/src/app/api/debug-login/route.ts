import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/features/auth/utils/password'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('Debug login attempt for:', email)
    
    // Sprawdź użytkownika
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true
      }
    })
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        email: email.toLowerCase()
      }, { status: 404 })
    }
    
    if (!user.password) {
      return NextResponse.json({
        error: 'User has no password set',
        userId: user.id
      }, { status: 400 })
    }
    
    // Sprawdź hasło
    const isValid = await comparePassword(password, user.password)
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      passwordValid: isValid,
      hasPassword: !!user.password
    })
    
  } catch (error: any) {
    console.error('Debug login error:', error)
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: error
    }, { status: 500 })
  }
}