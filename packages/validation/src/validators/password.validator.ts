import { z } from 'zod';

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export const passwordValidator = z.string()
  .min(PASSWORD_REQUIREMENTS.minLength, 
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  .max(PASSWORD_REQUIREMENTS.maxLength,
    `Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireUppercase || /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireLowercase || /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireNumber || /\d/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => !PASSWORD_REQUIREMENTS.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Password must contain at least one special character'
  );

export const passwordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.min(strength, 5); // Max strength of 5
};