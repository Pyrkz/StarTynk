import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test połączenia z bazą danych
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'missing'
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}