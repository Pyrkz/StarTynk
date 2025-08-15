// Global test setup
import 'jest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep these for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'ERROR';