// Mock implementation of next-auth hooks for demo
export function useSession() {
  return {
    data: null,
    status: 'unauthenticated' as const,
    update: async () => null
  }
}

export function signIn(provider?: string, options?: any) {
  console.log('Sign in disabled for demo', provider, options)
  // Always redirect to dashboard for demo
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard'
  }
  return Promise.resolve({ error: undefined, status: 200, ok: true, url: '/dashboard' })
}

export function signOut() {
  console.log('Sign out disabled for demo')
  return Promise.resolve({ url: window.location.origin })
}