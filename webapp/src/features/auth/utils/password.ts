import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hashuje hasło używając bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Porównuje hasło z hashem
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Sprawdza siłę hasła
 */
export function checkPasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Długość
  if (password.length >= 8) score += 1
  else feedback.push('Hasło powinno mieć minimum 8 znaków')

  if (password.length >= 12) score += 1

  // Małe litery
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Hasło powinno zawierać małe litery')

  // Duże litery
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Hasło powinno zawierać duże litery')

  // Cyfry
  if (/\d/.test(password)) score += 1
  else feedback.push('Hasło powinno zawierać cyfry')

  // Znaki specjalne
  if (/[@$!%*?&]/.test(password)) score += 1
  else feedback.push('Hasło powinno zawierać znaki specjalne')

  return {
    isValid: score >= 5,
    score,
    feedback
  }
}

/**
 * Generuje bezpieczny losowy string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}