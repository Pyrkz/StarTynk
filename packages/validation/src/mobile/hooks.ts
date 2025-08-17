import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';

export interface ValidationState<T> {
  data: T | null;
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
}

export interface UseValidationOptions {
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  defaultValues?: any;
  debounceMs?: number;
}

export interface UseValidationReturn<T extends z.ZodSchema> {
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
  validate: (data: unknown) => Promise<{ success: boolean; data?: z.infer<T>; errors?: Record<string, string[]> }>;
  validateField: (field: string, value: unknown) => Promise<boolean>;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  setFieldError: (field: string, error: string) => void;
  reset: () => void;
  getFieldError: (field: string) => string | undefined;
  hasFieldError: (field: string) => boolean;
  register: (field: string) => {
    onChangeText: (value: string) => void;
    onBlur: () => void;
    error: string | undefined;
    value: any;
  };
}

export function useValidation<T extends z.ZodSchema>(
  schema: T,
  options: UseValidationOptions = {}
): UseValidationReturn<T> {
  const {
    mode = 'onSubmit',
    reValidateMode = 'onChange',
    defaultValues = {},
    debounceMs = 300,
  } = options;
  
  const [state, setState] = useState<ValidationState<z.infer<T>>>({
    data: defaultValues,
    errors: {},
    isValid: true,
    isValidating: false,
    isDirty: false,
  });
  
  const values = useRef<Record<string, any>>(defaultValues);
  const touched = useRef<Set<string>>(new Set());
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Validate entire form
  const validate = useCallback(async (data: unknown) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await schema.safeParseAsync(data);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          data: result.data,
          errors: {},
          isValid: true,
          isValidating: false,
        }));
        return { success: true, data: result.data };
      }
      
      const fieldErrors: Record<string, string[]> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      });
      
      setState(prev => ({
        ...prev,
        errors: fieldErrors,
        isValid: false,
        isValidating: false,
      }));
      
      return { success: false, errors: fieldErrors };
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      throw error;
    }
  }, [schema]);
  
  // Validate single field
  const validateField = useCallback(async (field: string, value: unknown) => {
    const fieldPath = field.split('.');
    let fieldSchema: any = schema;
    
    // Navigate to nested schema
    for (const part of fieldPath) {
      if (fieldSchema instanceof z.ZodObject) {
        fieldSchema = fieldSchema.shape[part];
      } else if (fieldSchema instanceof z.ZodArray) {
        fieldSchema = fieldSchema.element;
      }
    }
    
    if (!fieldSchema) return true;
    
    try {
      const result = await fieldSchema.safeParseAsync(value);
      
      if (result.success) {
        setState(prev => {
          const newErrors = { ...prev.errors };
          delete newErrors[field];
          return {
            ...prev,
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0,
          };
        });
        return true;
      }
      
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: result.error.issues.map((i: any) => i.message),
        },
        isValid: false,
      }));
      
      return false;
    } catch (error) {
      return false;
    }
  }, [schema]);
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);
  
  // Clear specific field error
  const clearFieldError = useCallback((field: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);
  
  // Set field error manually
  const setFieldError = useCallback((field: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: [error],
      },
      isValid: false,
    }));
  }, []);
  
  // Reset form
  const reset = useCallback(() => {
    values.current = defaultValues;
    touched.current.clear();
    setState({
      data: defaultValues,
      errors: {},
      isValid: true,
      isValidating: false,
      isDirty: false,
    });
  }, [defaultValues]);
  
  // Get field error
  const getFieldError = useCallback((field: string): string | undefined => {
    return state.errors[field]?.[0];
  }, [state.errors]);
  
  // Check if field has error
  const hasFieldError = useCallback((field: string): boolean => {
    return !!state.errors[field]?.length;
  }, [state.errors]);
  
  // Register field for React Native inputs
  const register = useCallback((field: string) => {
    return {
      onChangeText: (value: string) => {
        values.current[field] = value;
        setState(prev => ({ ...prev, isDirty: true }));
        
        // Clear existing debounce
        if (debounceTimers.current[field]) {
          clearTimeout(debounceTimers.current[field]);
        }
        
        // Validate based on mode
        if (mode === 'onChange' || mode === 'all' || 
            (touched.current.has(field) && reValidateMode === 'onChange')) {
          debounceTimers.current[field] = setTimeout(() => {
            validateField(field, value);
          }, debounceMs);
        }
      },
      onBlur: () => {
        touched.current.add(field);
        
        if (mode === 'onBlur' || mode === 'all' ||
            (touched.current.has(field) && reValidateMode === 'onBlur')) {
          validateField(field, values.current[field]);
        }
      },
      error: getFieldError(field),
      value: values.current[field] || '',
    };
  }, [mode, reValidateMode, debounceMs, validateField, getFieldError]);
  
  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  return {
    errors: state.errors,
    isValid: state.isValid,
    isValidating: state.isValidating,
    isDirty: state.isDirty,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
    reset,
    getFieldError,
    hasFieldError,
    register,
  };
}

// Form validation hook with form state management
export interface UseFormOptions<T> extends UseValidationOptions {
  onSubmit?: (data: T) => void | Promise<void>;
  onError?: (errors: Record<string, string[]>) => void;
}

export function useForm<T extends z.ZodSchema>(
  schema: T,
  options: UseFormOptions<z.infer<T>> = {}
) {
  const { onSubmit, onError, ...validationOptions } = options;
  const validation = useValidation(schema, validationOptions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      const result = await validation.validate(validation.register);
      
      if (result.success && result.data) {
        if (onSubmit) {
          await onSubmit(result.data);
        }
      } else if (result.errors) {
        if (onError) {
          onError(result.errors);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, onSubmit, onError]);
  
  return {
    ...validation,
    isSubmitting,
    handleSubmit,
  };
}