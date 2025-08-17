import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { Role } from '@repo/database'
import { cacheMiddleware } from './middleware/cache.middleware'

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
  
  // Handle API versioning redirect
  if (
    pathname.startsWith('/api/') && 
    !pathname.startsWith('/api/v') &&
    !pathname.startsWith('/api/auth/')
  ) {
    const newPath = pathname.replace('/api/', '/api/v1/');
    const url = new URL(newPath, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Handle caching for API routes
  if (pathname.startsWith('/api')) {
    // Apply cache middleware for GET requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      const cacheResponse = await cacheMiddleware(request, {
        enableAnalytics: true,
        enableCompression: true,
        enableOptimization: true,
      });
      
      // If cache middleware returns a response, use it
      if (cacheResponse) {
        return cacheResponse;
      }
    }
  }

  // Handle CORS for API routes
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next()
    
    // Add API version header
    response.headers.set('X-API-Version', process.env.API_VERSION || 'v1')
    response.headers.set('X-Response-Time', Date.now().toString())
    
    // Get origin from request
    const origin = request.headers.get('origin')
    const env = process.env.NODE_ENV || 'production'
    
    // Define allowed origins based on environment
    const allowedOrigins: Record<string, (string | RegExp)[]> = {
      development: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8081',
        'http://localhost:19000',
        'http://localhost:19001',
        'http://localhost:19002',
        'exp://localhost:8081',
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Local network IPs
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,  // Local network IPs
        /^exp:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,  // Expo URLs
      ],
      staging: [
        'https://staging.startynk.com',
        'https://staging-mobile.startynk.com',
        'exp://exp.host/@yourusername/startynk-staging',
      ],
      production: [
        'https://startynk.com',
        'https://www.startynk.com',
        'https://mobile.startynk.com',
        'exp://exp.host/@yourusername/startynk',
      ],
    }
    
    // Add custom origins from environment
    if (process.env.MOBILE_APP_URL) {
      allowedOrigins[env].push(process.env.MOBILE_APP_URL)
    }
    
    const origins = allowedOrigins[env] || allowedOrigins.production
    
    // Check if origin is allowed
    const isAllowedOrigin = origin && origins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin)
      }
      return allowed === origin
    })
    
    // Skip CORS for same-origin requests
    const requestUrl = new URL(request.url)
    if (origin === requestUrl.origin) {
      // Same origin request, no CORS needed
    } else if (!isAllowedOrigin && env === 'development') {
      // In development, allow all origins but log warning
      console.warn(`⚠️ CORS: Allowing origin ${origin} in development mode`)
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    } else if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Client-Type, X-Device-Id, X-App-Version')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: response.headers })
    }
    
    // For non-NextAuth API routes, skip the auth check below
    if (!pathname.startsWith('/api/auth/')) {
      return response
    }
  }
  
  // Sprawdź czy trasa jest publiczna lub NextAuth
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isNextAuthRoute = pathname.startsWith('/api/auth/')
  
  if (isPublicRoute || isNextAuthRoute) {
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