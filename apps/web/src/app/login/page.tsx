'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { loginSchema, registerWithInviteSchema } from '@/features/auth/schemas/auth.schema'
import { AUTH_ERRORS } from '@/features/auth/types/auth.types'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Walidacja danych
      const validationSchema = isNewUser ? registerWithInviteSchema : loginSchema
      const validatedData = validationSchema.parse({
        email,
        password,
        ...(isNewUser && { invitationCode })
      })

      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        ...(isNewUser && invitationCode ? { invitationCode } : {}),
        redirect: false,
      })
      
      if (result?.error) {
        // Mapowanie błędów na przyjazne komunikaty
        const errorMessage = AUTH_ERRORS[result.error as keyof typeof AUTH_ERRORS] || result.error
        setError(errorMessage)
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err?.errors) {
        // Błędy walidacji zod
        setError(err.errors[0].message)
      } else if (err?.issues) {
        // Błędy walidacji zod (inny format)
        setError(err.issues[0].message)
      } else {
        setError('Wystąpił nieoczekiwany błąd. Sprawdź konsolę.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setError('Błąd logowania przez Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-brand-gradient rounded-2xl flex items-center justify-center mb-6 shadow-brand transform hover:scale-105 transition-transform duration-250">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="heading-1 mb-3">
            Witaj ponownie
          </h1>
          <p className="text-body">
            {isNewUser ? 'Utwórz swoje konto z kodem zaproszenia' : 'Zaloguj się do swojego konta'}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="card animate-slide-up">
          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl flex items-center gap-3 animate-scale-in">
              <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
              <p className="text-error-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Adres email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="twoj@email.com"
              required
            />

            <div className="relative">
              <Input
                label="Hasło"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Twoje hasło"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isNewUser && (
              <Input
                label="Kod zaproszenia"
                value={invitationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitationCode(e.target.value)}
                placeholder="Wprowadź kod zaproszenia"
                required
              />
            )}

            <button
              type="submit"
              className="btn-primary w-full text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ładowanie...
                </span>
              ) : (
                isNewUser ? 'Utwórz konto' : 'Zaloguj się'
              )}
            </button>
          </form>

          {/* Google Sign In */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <div className="my-6 flex items-center">
                <div className="flex-1 h-px bg-neutral-200"></div>
                <span className="px-4 text-neutral-500 text-sm font-medium">lub</span>
                <div className="flex-1 h-px bg-neutral-200"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="btn-secondary w-full text-lg font-medium flex items-center justify-center"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Kontynuuj z Google
              </button>
            </>
          )}

          {/* Toggle between login/register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsNewUser(!isNewUser)}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors hover:underline underline-offset-2"
            >
              {isNewUser 
                ? 'Masz już konto? Zaloguj się' 
                : 'Pierwszy raz? Użyj kodu zaproszenia'
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-neutral-500 text-sm animate-fade-in">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            Chronione przez zaawansowane zabezpieczenia
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-brand-gradient rounded-2xl flex items-center justify-center mb-6 shadow-brand">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="heading-1 mb-3">
              Ładowanie...
            </h1>
          </div>
          <div className="card">
            <div className="space-y-6">
              <div className="skeleton h-16 rounded-xl"></div>
              <div className="skeleton h-16 rounded-xl"></div>
              <div className="skeleton h-12 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}