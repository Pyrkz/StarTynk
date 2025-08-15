import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { Role } from '@prisma/client'

// Konfiguracja tras
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings',
  '/employees',
  '/reports',
  '/planner',
]

const adminOnlyRoutes = [
  '/admin',
]

const publicRoutes = [
  '/login',
  '/api/auth',
]

// Hierarchia ról
const roleHierarchy: Record<Role, number> = {
  USER: 1,
  WORKER: 2,
  COORDINATOR: 3,
  MODERATOR: 4,
  ADMIN: 5,
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next()
    
    // Get origin from request
    const origin = request.headers.get('origin')
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:8081', // Expo development
      'http://localhost:19000', // Expo web
      'http://localhost:19001', // Expo web
      'http://localhost:19002', // Expo web
      'http://localhost:3000', // Next.js development
      'http://localhost:3001', // Alternative Next.js port
    ]
    
    // Add production URLs from environment
    if (process.env.MOBILE_APP_URL) {
      allowedOrigins.push(process.env.MOBILE_APP_URL)
    }
    
    // Check if origin is allowed
    const isAllowedOrigin = origin && (
      allowedOrigins.includes(origin) ||
      origin.includes('exp://') || // Expo development
      origin.includes('expo.dev') || // Expo development
      origin.includes('localhost') || // Local development
      origin.includes('192.168.') || // Local network
      origin.includes('10.0.') // Local network
    )
    
    // Set CORS headers
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow any origin
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
    
    // For API routes, skip the auth check below
    if (!pathname.startsWith('/api/auth/[...nextauth]')) {
      return response
    }
  }
  
  // Sprawdź czy trasa jest publiczna
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Pobierz token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Sprawdź czy trasa jest chroniona
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !token) {
    // Przekieruj do logowania jeśli nie ma tokena
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Sprawdź uprawnienia dla tras administracyjnych
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
  
  if (isAdminRoute && token) {
    const userRole = token.role as Role
    const hasPermission = roleHierarchy[userRole] >= roleHierarchy.ADMIN
    
    if (!hasPermission) {
      // Przekieruj do dashboard jeśli brak uprawnień
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Dodaj nagłówki bezpieczeństwa
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  
  // HSTS dla produkcji
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  
  return response
}

// Konfiguracja dla jakich tras ma działać middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}