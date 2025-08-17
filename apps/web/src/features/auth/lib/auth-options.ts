import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@repo/database'
import { comparePassword } from '../utils/password'
import { loginSchema } from '../schemas/auth.schema'
import { createUserActivityLog } from '../utils/activity-logger'
import { handleRegistrationWithInvite } from './registration'
import type { User, Role } from '@repo/database'

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required')
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL is not set, using default')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        invitationCode: { label: "Invitation Code", type: "text", optional: true }
      },
      
      async authorize(credentials) {
        try {
          // Sprawdź czy to próba rejestracji z kodem zaproszenia
          if (credentials?.invitationCode && credentials.invitationCode.trim() !== '') {
            return await handleRegistrationWithInvite(credentials)
          }
          
          // Walidacja danych wejściowych dla logowania
          const validatedData = loginSchema.parse(credentials)
          
          // Znajdź użytkownika
          const user = await prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              isActive: true,
              image: true
            }
          })
          
          if (!user) {
            console.log('User not found:', validatedData.email)
            await createUserActivityLog({
              userId: 'anonymous',
              action: 'LOGIN_FAILED',
              details: { email: validatedData.email, reason: 'User not found' }
            })
            return null
          }
          
          if (!user.password) {
            console.log('User has no password:', user.id)
            await createUserActivityLog({
              userId: user.id,
              action: 'LOGIN_FAILED',
              details: { reason: 'No password set' }
            })
            return null
          }
          
          // Sprawdź czy konto jest aktywne
          if (!user.isActive) {
            await createUserActivityLog({
              userId: user.id,
              action: 'LOGIN_BLOCKED',
              details: { reason: 'Account inactive' }
            })
            return null
          }
          
          // Weryfikacja hasła
          const isValidPassword = await comparePassword(
            validatedData.password,
            user.password
          )
          
          if (!isValidPassword) {
            await createUserActivityLog({
              userId: user.id,
              action: 'LOGIN_FAILED',
              details: { reason: 'Invalid password' }
            })
            return null
          }
          
          // Aktualizacja statystyk logowania
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
              loginCount: { increment: 1 }
            }
          })
          
          // Logowanie udanej próby
          await createUserActivityLog({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            details: { method: 'credentials' }
          })
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          }
          
        } catch (error: any) {
          console.error('Authorization error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
          })
          return null
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dni
    updateAge: 24 * 60 * 60, // 24 godziny
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dni
  },
  
  callbacks: {
    async signIn({ user, account }) {
      // Dodatkowa walidacja przy logowaniu
      if (account?.provider === 'credentials') {
        return true
      }
      return true
    },
    
    async jwt({ token, user, trigger, session }) {
      // Pierwsze logowanie - dodaj dane użytkownika do tokena
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.email = user.email
      }
      
      // Aktualizacja sesji
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }
      
      // Weryfikacja czy token jest nadal ważny
      try {
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, role: true }
          })
          
          if (!dbUser || !dbUser.isActive) {
            console.log('User token invalid or inactive:', token.id)
            return {}
          }
          
          // Aktualizuj rolę jeśli się zmieniła
          if (dbUser.role !== token.role) {
            token.role = dbUser.role
          }
        }
      } catch (error) {
        console.error('JWT callback error:', error)
        // Return empty token to force re-authentication
        return {}
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Dodaj dane z tokena do sesji
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.email = token.email as string
      }
      
      return session
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  events: {
    async signOut({ token }) {
      // Logowanie wylogowania
      if (token?.id) {
        await createUserActivityLog({
          userId: token.id as string,
          action: 'LOGOUT',
          details: {}
        })
      }
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata })
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', { code, metadata })
      }
    }
  },
}