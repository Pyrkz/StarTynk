import { describe, it, expect, vi } from 'vitest';
import { Sanitizer, sanitize } from '../sanitizers';
import { RateLimiter, MemoryRateLimitStore } from '../rate-limit';
import { RateLimitError } from '../errors';

describe('Security', () => {
  describe('Sanitization', () => {
    describe('SQL injection prevention', () => {
      it('should escape SQL special characters', () => {
        const maliciousInputs = [
          "'; DROP TABLE users; --",
          "1' OR '1'='1",
          "admin'--",
          "1; DELETE FROM users WHERE 1=1;",
        ];
        
        maliciousInputs.forEach(input => {
          const sanitized = Sanitizer.escapeSql(input);
          expect(sanitized).not.toContain("'");
          expect(sanitized).not.toContain(';');
          expect(sanitized).not.toContain('--');
        });
      });
    });
    
    describe('XSS attack prevention', () => {
      it('should remove script tags and dangerous attributes', () => {
        const xssAttempts = [
          '<script>alert("XSS")</script>',
          '<img src="x" onerror="alert(\'XSS\')">',
          '<a href="javascript:alert(\'XSS\')">Click</a>',
          '<div onmouseover="alert(\'XSS\')">Hover</div>',
        ];
        
        xssAttempts.forEach(input => {
          const sanitized = Sanitizer.sanitizeHTML(input);
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('onerror');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onmouseover');
        });
      });
      
      it('should preserve safe HTML', () => {
        const safeHTML = '<p>Hello <strong>world</strong>!</p>';
        const sanitized = Sanitizer.sanitizeHTML(safeHTML);
        expect(sanitized).toContain('<p>');
        expect(sanitized).toContain('<strong>');
      });
    });
    
    describe('Path traversal prevention', () => {
      it('should sanitize file paths', () => {
        const maliciousPaths = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32',
          'uploads/../../../config',
          '/etc/passwd',
        ];
        
        maliciousPaths.forEach(path => {
          const sanitized = Sanitizer.sanitizePath(path);
          expect(sanitized).not.toContain('..');
          expect(sanitized).not.toMatch(/^[\/\\]/);
        });
      });
    });
    
    describe('NoSQL injection prevention', () => {
      it('should remove MongoDB operators', () => {
        const maliciousQuery = {
          username: 'admin',
          password: { $ne: null },
          $where: 'this.password.length > 0',
        };
        
        const sanitized = Sanitizer.sanitizeMongoQuery(maliciousQuery);
        expect(sanitized.password).not.toHaveProperty('$ne');
        expect(sanitized).not.toHaveProperty('$where');
      });
    });
    
    describe('Sensitive data masking', () => {
      it('should redact sensitive information from logs', () => {
        const sensitiveData = {
          username: 'user@example.com',
          password: 'SecretPass123!',
          creditCard: '4111111111111111',
          ssn: '123-45-6789',
          apiKey: 'sk_test_123456',
          data: {
            token: 'bearer eyJhbGc...',
          },
        };
        
        const sanitized = Sanitizer.sanitizeForLogging(sensitiveData);
        expect(sanitized.username).toBe('user@example.com');
        expect(sanitized.password).toBe('[REDACTED]');
        expect(sanitized.creditCard).toBe('[REDACTED]');
        expect(sanitized.ssn).toBe('[REDACTED]');
        expect(sanitized.apiKey).toBe('[REDACTED]');
        expect(sanitized.data.token).toBe('[REDACTED]');
      });
    });
  });
  
  describe('Rate Limiting', () => {
    let limiter: RateLimiter;
    let store: MemoryRateLimitStore;
    
    beforeEach(() => {
      store = new MemoryRateLimitStore();
      limiter = new RateLimiter(store);
    });
    
    it('should enforce rate limits', async () => {
      const key = 'test-user';
      const config = 'auth:login'; // 5 requests per 15 minutes
      
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = await limiter.consume(key, 1, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
      
      // 6th request should fail
      await expect(limiter.consume(key, 1, config)).rejects.toThrow(RateLimitError);
    });
    
    it('should block after limit exceeded', async () => {
      const key = 'blocked-user';
      const config = 'auth:login';
      
      // Exceed limit
      for (let i = 0; i < 5; i++) {
        await limiter.consume(key, 1, config);
      }
      
      // Should throw rate limit error
      try {
        await limiter.consume(key, 1, config);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
      }
      
      // Check if blocked
      const isBlocked = await limiter.isBlocked(key, config);
      expect(isBlocked).toBe(true);
    });
    
    it('should reset rate limits', async () => {
      const key = 'reset-user';
      const config = 'api:read';
      
      // Consume some points
      await limiter.consume(key, 50, config);
      
      // Reset
      await limiter.reset(key, config);
      
      // Should be able to consume again
      const result = await limiter.consume(key, 1, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });
    
    it('should handle different rate limit configs', async () => {
      const key = 'multi-config-user';
      
      // API read: 100 per minute
      const readResult = await limiter.consume(key, 1, 'api:read');
      expect(readResult.remaining).toBe(99);
      
      // API write: 30 per minute
      const writeResult = await limiter.consume(key, 1, 'api:write');
      expect(writeResult.remaining).toBe(29);
      
      // Different limits for different operations
      expect(readResult.remaining).not.toBe(writeResult.remaining);
    });
  });
});