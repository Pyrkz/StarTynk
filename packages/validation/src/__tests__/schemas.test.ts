import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  emailSchema,
  phoneSchema,
  passwordSchema,
  moneySchema,
  dateRangeSchema,
  createProjectSchema,
  attendanceSchema,
} from '../schemas';

describe('Validation Schemas', () => {
  describe('Auth Schemas', () => {
    describe('loginSchema', () => {
      it('should validate email login correctly', () => {
        const validData = {
          method: 'email',
          email: 'test@example.com',
          password: 'Test123!@#',
          rememberMe: true,
        };
        
        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
      
      it('should validate phone login correctly', () => {
        const validData = {
          method: 'phone',
          phone: '+48123456789',
          password: 'Test123!@#',
        };
        
        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid login data', () => {
        const invalidData = {
          method: 'email',
          email: 'invalid-email',
          password: 'weak',
        };
        
        const result = loginSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
    
    describe('registerSchema', () => {
      it('should validate registration data', () => {
        const validData = {
          email: 'new@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          name: 'Jan Kowalski',
          acceptTerms: true,
        };
        
        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
      
      it('should reject mismatched passwords', () => {
        const invalidData = {
          email: 'new@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
          name: 'Jan Kowalski',
          acceptTerms: true,
        };
        
        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Passwords don't match");
      });
    });
  });
  
  describe('Common Schemas', () => {
    describe('emailSchema', () => {
      it('should validate correct emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@company.co.uk',
          'first+last@domain.com',
        ];
        
        validEmails.forEach(email => {
          const result = emailSchema.safeParse(email);
          expect(result.success).toBe(true);
        });
      });
      
      it('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid',
          '@example.com',
          'test@',
          'test..double@example.com',
          'test@example',
        ];
        
        invalidEmails.forEach(email => {
          const result = emailSchema.safeParse(email);
          expect(result.success).toBe(false);
        });
      });
    });
    
    describe('passwordSchema', () => {
      it('should enforce password strength', () => {
        const validPasswords = [
          'Test123!',
          'SecureP@ss99',
          'MyStr0ng!Pass',
        ];
        
        validPasswords.forEach(password => {
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(true);
        });
      });
      
      it('should reject weak passwords', () => {
        const weakPasswords = [
          'password',
          '12345678',
          'test',
          'Test1234', // No special char
          'test!@#$', // No uppercase
          'TEST!@#$', // No lowercase
          'TestTest!', // No number
        ];
        
        weakPasswords.forEach(password => {
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(false);
        });
      });
    });
    
    describe('moneySchema', () => {
      it('should validate money amounts', () => {
        const validAmounts = [0, 100, 999.99, 1000.00];
        
        validAmounts.forEach(amount => {
          const result = moneySchema.safeParse(amount);
          expect(result.success).toBe(true);
        });
      });
      
      it('should reject invalid money amounts', () => {
        const invalidAmounts = [-10, 999999999.999, 100.999];
        
        invalidAmounts.forEach(amount => {
          const result = moneySchema.safeParse(amount);
          expect(result.success).toBe(false);
        });
      });
    });
    
    describe('dateRangeSchema', () => {
      it('should validate date ranges', () => {
        const validRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        };
        
        const result = dateRangeSchema.safeParse(validRange);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid date ranges', () => {
        const invalidRange = {
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01'),
        };
        
        const result = dateRangeSchema.safeParse(invalidRange);
        expect(result.success).toBe(false);
      });
    });
  });
  
  describe('Business Logic', () => {
    describe('createProjectSchema', () => {
      it('should validate project creation data', () => {
        const validProject = {
          name: 'Test Project',
          address: {
            street: 'Main Street',
            buildingNumber: '123',
            city: 'Warsaw',
            postalCode: '00-001',
            country: 'PL',
          },
          developerId: '123e4567-e89b-12d3-a456-426614174000',
          dates: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          },
          budget: {
            total: 100000,
            labor: 50000,
            materials: 40000,
            contingency: 10000,
          },
          assignedUsers: ['123e4567-e89b-12d3-a456-426614174001'],
        };
        
        const result = createProjectSchema.safeParse(validProject);
        expect(result.success).toBe(true);
      });
      
      it('should reject budget exceeding total', () => {
        const invalidProject = {
          name: 'Test Project',
          address: {
            street: 'Main Street',
            buildingNumber: '123',
            city: 'Warsaw',
            postalCode: '00-001',
            country: 'PL',
          },
          developerId: '123e4567-e89b-12d3-a456-426614174000',
          dates: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          },
          budget: {
            total: 100000,
            labor: 60000,
            materials: 50000, // Total exceeds 100000
          },
          assignedUsers: ['123e4567-e89b-12d3-a456-426614174001'],
        };
        
        const result = createProjectSchema.safeParse(invalidProject);
        expect(result.success).toBe(false);
      });
    });
    
    describe('attendanceSchema', () => {
      it('should validate attendance records', () => {
        const validAttendance = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          checkIn: new Date('2024-01-01T08:00:00'),
          location: {
            latitude: 52.2297,
            longitude: 21.0122,
          },
        };
        
        const result = attendanceSchema.safeParse(validAttendance);
        expect(result.success).toBe(true);
      });
      
      it('should reject check-in outside business hours', () => {
        const invalidAttendance = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          checkIn: new Date('2024-01-01T03:00:00'), // 3 AM
          location: {
            latitude: 52.2297,
            longitude: 21.0122,
          },
        };
        
        const result = attendanceSchema.safeParse(invalidAttendance);
        expect(result.success).toBe(false);
      });
    });
  });
});