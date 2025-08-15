import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        invitationCode: { label: 'Invitation Code', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔐 Próba logowania:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email i hasło są wymagane')
        }

        // Sprawdź czy użytkownik już istnieje
        const existingUser = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (existingUser) {
          // Logowanie istniejącego użytkownika
          console.log('✅ Znaleziono użytkownika:', existingUser.email)
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            existingUser.password || ''
          )
          
          console.log('🔑 Weryfikacja hasła:', isPasswordValid)
          
          if (!isPasswordValid) {
            throw new Error('Nieprawidłowe hasło')
          }

          if (!existingUser.isActive) {
            throw new Error('Konto zostało dezaktywowane')
          }

          // Update last login and login count
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              lastLoginAt: new Date(),
              loginCount: existingUser.loginCount + 1,
            }
          })

          // Log login activity
          await prisma.userActivityLog.create({
            data: {
              userId: existingUser.id,
              action: 'login',
              details: JSON.stringify({
                method: 'credentials'
              })
            }
          })

          console.log('🚀 Zwracam użytkownika:', {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          })
          
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role
          }
        } else {
          // Rejestracja nowego użytkownika z kodem zaproszenia
          if (!credentials.invitationCode) {
            throw new Error('Kod zaproszenia jest wymagany dla nowych użytkowników')
          }

          // Sprawdź kod zaproszenia
          const invitation = await prisma.invitationCode.findUnique({
            where: { code: credentials.invitationCode }
          })

          if (!invitation) {
            throw new Error('Nieprawidłowy kod zaproszenia')
          }

          if (invitation.usedAt) {
            throw new Error('Kod zaproszenia został już wykorzystany')
          }

          if (invitation.expiresAt < new Date()) {
            throw new Error('Kod zaproszenia wygasł')
          }

          if (invitation.email !== credentials.email) {
            throw new Error('Kod zaproszenia nie pasuje do podanego emaila')
          }

          // Utwórz nowego użytkownika
          const hashedPassword = await bcrypt.hash(credentials.password, 12)
          
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              invitedBy: invitation.invitedBy,
              role: invitation.role // Use role from invitation
            }
          })

          // Oznacz kod jako wykorzystany
          await prisma.invitationCode.update({
            where: { id: invitation.id },
            data: { usedAt: new Date() }
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          }
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        async profile(profile) {
          // Sprawdź czy użytkownik Google ma dostęp (można dodać logikę sprawdzania zaproszenia)
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            role: 'USER' as const
          }
        }
      })
    ] : [])
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🎯 JWT callback - user:', user)
      console.log('🎯 JWT callback - token przed:', token)
      
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      
      console.log('🎯 JWT callback - token po:', token)
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session
    },
    async signIn({ user, account }) {
      // Dodatkowa weryfikacja dla Google OAuth
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          // Sprawdź czy istnieje zaproszenie dla tego emaila
          const invitation = await prisma.invitationCode.findFirst({
            where: {
              email: user.email!,
              usedAt: null,
              expiresAt: { gt: new Date() }
            }
          })
          
          if (!invitation) {
            return false // Brak zaproszenia - odmów dostępu
          }
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}