import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { LoginRequest, RegisterRequest } from '@repo/shared/types';

export interface LoginFormData {
  identifier: string;
  password: string;
  loginMethod: 'email' | 'phone';
  rememberMe: boolean;
}

export interface RegisterFormData {
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  name: string;
  loginMethod: 'email' | 'phone';
}

/**
 * Auth form hook with validation and submission logic
 */
export function useAuthForm() {
  const { login, register, isLoginLoading, isLoading, loginError, error } = useAuth();
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Login form handler
  const handleLogin = useCallback(async (formData: LoginFormData) => {
    setValidationErrors({});

    // Validation
    const errors: Record<string, string> = {};
    
    if (!formData.identifier.trim()) {
      errors.identifier = 'Email or phone is required';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }
    
    if (formData.loginMethod === 'email' && formData.identifier && !isValidEmail(formData.identifier)) {
      errors.identifier = 'Please enter a valid email address';
    }
    
    if (formData.loginMethod === 'phone' && formData.identifier && !isValidPhone(formData.identifier)) {
      errors.identifier = 'Please enter a valid phone number';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return { success: false, errors };
    }

    // Submit
    const request: LoginRequest = {
      identifier: formData.identifier,
      password: formData.password,
      loginMethod: formData.loginMethod,
      rememberMe: formData.rememberMe,
    };

    const response = await login(request);
    
    if (!response.success && response.error) {
      setValidationErrors({ general: response.error });
    }

    return response;
  }, [login]);

  // Register form handler
  const handleRegister = useCallback(async (formData: RegisterFormData) => {
    setValidationErrors({});

    // Validation
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (formData.loginMethod === 'email') {
      if (!formData.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!isValidEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    } else {
      if (!formData.phone?.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!isValidPhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return { success: false, errors };
    }

    // Submit
    const request: RegisterRequest = {
      email: formData.loginMethod === 'email' ? formData.email : undefined,
      phone: formData.loginMethod === 'phone' ? formData.phone : undefined,
      password: formData.password,
      name: formData.name,
    };

    const response = await register(request);
    
    if (!response.success && response.error) {
      setValidationErrors({ general: response.error });
    }

    return response;
  }, [register]);

  return {
    handleLogin,
    handleRegister,
    validationErrors,
    isLoginLoading,
    isRegisterLoading: isLoading,
    loginError,
    registerError: error,
    clearErrors: () => setValidationErrors({}),
  };
}

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}