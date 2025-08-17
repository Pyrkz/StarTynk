import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/features/auth/lib/auth-options'

export async function GET(request: NextRequest) {
  try {
    // Basic auth options validation
    const authValid = {
      hasProviders: !!authOptions.providers?.length,
      hasSession: !!authOptions.session,
      hasJWT: !!authOptions.jwt,
      hasCallbacks: !!authOptions.callbacks,
      hasPages: !!authOptions.pages,
      secret: !!process.env.NEXTAUTH_SECRET,
      url: process.env.NEXTAUTH_URL || 'not set',
      adapterType: typeof authOptions.adapter
    }

    return NextResponse.json({
      message: 'NextAuth Debug Information',
      environment: process.env.NODE_ENV,
      nextAuthVersion: '4.24.11',
      authOptions: authValid,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      error: 'Failed to get auth debug info',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}