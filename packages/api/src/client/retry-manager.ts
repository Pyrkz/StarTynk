import type { RetryOptions } from './types/offline.types';

/**
 * Retry manager with exponential backoff and jitter
 */
export class RetryManager {
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_BASE_DELAY = 1000; // 1 second
  private readonly DEFAULT_MAX_DELAY = 30000; // 30 seconds
  private readonly DEFAULT_BACKOFF_FACTOR = 2;
  private readonly DEFAULT_JITTER_FACTOR = 0.1; // 10% jitter

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = this.DEFAULT_RETRIES,
      baseDelay = this.DEFAULT_BASE_DELAY,
      maxDelay = this.DEFAULT_MAX_DELAY,
      backoffFactor = this.DEFAULT_BACKOFF_FACTOR,
      retryableErrors = [],
      onRetry,
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Execute the function
        const result = await fn();
        
        // Success - return result
        if (attempt > 0) {
          console.debug(`Retry successful on attempt ${attempt + 1}`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if we should retry
        if (!this.shouldRetry(error, attempt + 1, maxAttempts, retryableErrors)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
        
        // Notify about retry
        if (onRetry) {
          try {
            onRetry(attempt + 1, error);
          } catch (callbackError) {
            console.warn('Retry callback error:', callbackError);
          }
        }

        console.debug(`Retrying after ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`, {
          error: error.message || error.code,
          delay,
        });

        // Wait before retry
        await this.waitWithJitter(delay);
      }
    }

    // All retries exhausted
    throw this.enhanceErrorWithRetryInfo(lastError, maxAttempts);
  }

  /**
   * Calculate delay with exponential backoff
   */
  calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffFactor: number
  ): number {
    // Exponential backoff: delay = baseDelay * (backoffFactor ^ attempt)
    const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt);
    
    // Cap at max delay
    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Check if error is retryable
   */
  shouldRetry(
    error: any,
    attempt: number,
    maxAttempts: number,
    retryableErrors: string[]
  ): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= maxAttempts) {
      return false;
    }

    // Check if error is in retryable list
    if (retryableErrors.length > 0) {
      const errorCode = error?.code || error?.message || '';
      return retryableErrors.some(retryable => 
        errorCode.includes(retryable) || error[retryable] === true
      );
    }

    // Default retry logic based on error type
    return this.isRetryableError(error);
  }

  /**
   * Wait with jitter to prevent thundering herd
   */
  async waitWithJitter(delay: number): Promise<void> {
    // Add random jitter (±10% by default)
    const jitterRange = delay * this.DEFAULT_JITTER_FACTOR;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    const finalDelay = Math.max(0, delay + jitter);

    return new Promise(resolve => setTimeout(resolve, finalDelay));
  }

  /**
   * Create a retry policy for specific scenarios
   */
  createPolicy(name: string): RetryOptions {
    switch (name) {
      case 'aggressive':
        return {
          maxAttempts: 5,
          baseDelay: 500,
          maxDelay: 10000,
          backoffFactor: 1.5,
        };
      
      case 'conservative':
        return {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffFactor: 3,
        };
      
      case 'auth':
        return {
          maxAttempts: 2,
          baseDelay: 1000,
          maxDelay: 2000,
          backoffFactor: 1,
          retryableErrors: ['ECONNABORTED', 'NETWORK_ERROR'],
        };
      
      case 'critical':
        return {
          maxAttempts: 10,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2,
          retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'ECONNABORTED'],
        };
      
      case 'background':
        return {
          maxAttempts: 3,
          baseDelay: 5000,
          maxDelay: 120000,
          backoffFactor: 2.5,
        };
      
      default:
        return {};
    }
  }

  /**
   * Execute with circuit breaker pattern
   */
  async executeWithCircuitBreaker<T>(
    fn: () => Promise<T>,
    circuitBreakerKey: string,
    options: RetryOptions & {
      failureThreshold?: number;
      resetTimeout?: number;
    } = {}
  ): Promise<T> {
    const state = this.getCircuitBreakerState(circuitBreakerKey);
    
    if (state.isOpen) {
      const now = Date.now();
      if (now < state.resetTime) {
        throw new Error(`Circuit breaker is open for ${circuitBreakerKey}`);
      } else {
        // Try to close the circuit
        state.isOpen = false;
        state.failures = 0;
      }
    }

    try {
      const result = await this.executeWithRetry(fn, options);
      
      // Success - reset failure count
      state.failures = 0;
      
      return result;
    } catch (error) {
      // Increment failure count
      state.failures++;
      
      // Check if we should open the circuit
      const threshold = options.failureThreshold || 5;
      if (state.failures >= threshold) {
        state.isOpen = true;
        state.resetTime = Date.now() + (options.resetTimeout || 60000); // 1 minute default
        console.warn(`Circuit breaker opened for ${circuitBreakerKey}`);
      }
      
      throw error;
    }
  }

  // Private helper methods

  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error?.isNetworkError || error?.code === 'NETWORK_ERROR') {
      return true;
    }

    // Timeout errors are retryable
    if (error?.isTimeoutError || error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status-based retry logic
    const status = error?.status || error?.response?.status;
    if (status) {
      // Server errors (5xx) are generally retryable
      if (status >= 500 && status < 600) {
        return true;
      }
      
      // Rate limiting (429) is retryable
      if (status === 429) {
        return true;
      }
      
      // Request timeout (408) is retryable
      if (status === 408) {
        return true;
      }
      
      // Service unavailable (503) is retryable
      if (status === 503) {
        return true;
      }
    }

    // Connection errors
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ECONNRESET') {
      return true;
    }

    // Default: don't retry
    return false;
  }

  private enhanceErrorWithRetryInfo(error: any, attempts: number): any {
    if (typeof error === 'object' && error !== null) {
      error.retryAttempts = attempts;
      error.retriesExhausted = true;
      
      if (!error.userMessage) {
        error.userMessage = `Operation failed after ${attempts} attempts. Please try again later.`;
      }
    }
    
    return error;
  }

  // Circuit breaker state management
  private circuitBreakerStates = new Map<string, {
    isOpen: boolean;
    failures: number;
    resetTime: number;
  }>();

  private getCircuitBreakerState(key: string) {
    if (!this.circuitBreakerStates.has(key)) {
      this.circuitBreakerStates.set(key, {
        isOpen: false,
        failures: 0,
        resetTime: 0,
      });
    }
    return this.circuitBreakerStates.get(key)!;
  }
}