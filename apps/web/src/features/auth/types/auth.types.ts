import type { Role } from '@prisma/client'
import type { ApiResponse, UserResponseDTO } from '@repo/shared/types'

// Rozszerzenie typów NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    role: Role
  }
}

// Typy dla odpowiedzi API - use shared types
export type AuthResponse = ApiResponse<void>

export interface LoginResponse extends ApiResponse<{
  user: UserResponseDTO
  token?: string
}> {}

// Typy dla middleware
export interface AuthMiddlewareOptions {
  allowedRoles?: Role[]
  requireAuth?: boolean
  redirectTo?: string
}

// Stałe
export const AUTH_ERRORS = {
  CredentialsSignin: 'Nieprawidłowy email lub hasło',
  INVALID_CREDENTIALS: 'Nieprawidłowy email lub hasło',
  ACCOUNT_INACTIVE: 'Konto jest nieaktywne',
  ACCOUNT_BLOCKED: 'Konto zostało zablokowane. Spróbuj ponownie za 15 minut',
  SESSION_EXPIRED: 'Sesja wygasła. Zaloguj się ponownie',
  UNAUTHORIZED: 'Brak uprawnień',
  FORBIDDEN: 'Dostęp zabroniony',
  INVALID_TOKEN: 'Nieprawidłowy token',
  USER_NOT_FOUND: 'Użytkownik nie istnieje',
  PASSWORD_TOO_WEAK: 'Hasło jest zbyt słabe',
  INVITATION_CODE_INVALID: 'Nieprawidłowy kod zaproszenia',
  INVITATION_CODE_EXPIRED: 'Kod zaproszenia wygasł',
  INVITATION_CODE_USED: 'Kod zaproszenia został już wykorzystany',
} as const

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Zalogowano pomyślnie',
  LOGOUT_SUCCESS: 'Wylogowano pomyślnie',
  PASSWORD_CHANGED: 'Hasło zostało zmienione',
  PASSWORD_RESET_SENT: 'Link do resetowania hasła został wysłany na email',
  ACCOUNT_CREATED: 'Konto zostało utworzone',
} as const