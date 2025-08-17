// Remove unused LoginMethod import
// import { LoginMethod } from '@repo/shared/types';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validatePhoneNumber = (phone: string): string | null => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return 'Numer telefonu jest wymagany';
  }
  
  if (cleanPhone.length !== 9) {
    return 'Numer telefonu musi mieć 9 cyfr';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Hasło jest wymagane';
  }
  
  if (password.length < 6) {
    return 'Hasło musi mieć co najmniej 6 znaków';
  }
  
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email jest wymagany';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Nieprawidłowy format email';
  }
  
  return null;
};

export const validateLoginForm = (
  loginMethod: 'email' | 'phone',
  phoneNumber: string, 
  email: string,
  password: string
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (loginMethod === 'phone') {
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
  } else {
    const emailError = validateEmail(email);
    if (emailError) {
      errors.email = emailError;
    }
  }
  
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};