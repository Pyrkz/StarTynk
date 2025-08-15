import { z } from 'zod'

// Schema dla logowania
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane'),
})

// Schema dla rejestracji z kodem zaproszenia
export const registerWithInviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Hasło musi zawierać: małą literę, dużą literę, cyfrę i znak specjalny'
    ),
  invitationCode: z
    .string()
    .min(1, 'Kod zaproszenia jest wymagany')
    .length(8, 'Kod zaproszenia musi mieć 8 znaków'),
})

// Schema dla zmiany hasła
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Obecne hasło jest wymagane'),
  newPassword: z
    .string()
    .min(8, 'Nowe hasło musi mieć minimum 8 znaków')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Hasło musi zawierać: małą literę, dużą literę, cyfrę i znak specjalny'
    ),
  confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

// Schema dla resetowania hasła
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email')
    .toLowerCase()
    .trim(),
})

// Schema dla ustawienia nowego hasła po resecie
export const setNewPasswordSchema = z.object({
  token: z.string().min(1, 'Token jest wymagany'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Hasło musi zawierać: małą literę, dużą literę, cyfrę i znak specjalny'
    ),
  confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

// Typy TypeScript generowane ze schematów
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterWithInviteInput = z.infer<typeof registerWithInviteSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>