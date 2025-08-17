import { AxiosError } from 'axios';

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  retryCondition: (error) => {
    // Retry on network errors or 5xx errors
    return !error.response || (error.response.status >= 500);
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const options = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === options.maxAttempts) {
        break;
      }

      if (error instanceof AxiosError && options.retryCondition) {
        if (!options.retryCondition(error)) {
          throw error;
        }
      }

      const delay = options.backoff === 'exponential'
        ? options.delay * Math.pow(2, attempt - 1)
        : options.delay;

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}