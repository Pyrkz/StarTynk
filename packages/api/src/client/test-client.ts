// Test file to verify imports work correctly
import { createAPIClient, createWebAPIClient, createMobileAPIClient } from './index';

// This should compile without errors
const testClient = createAPIClient();
const webClient = createWebAPIClient();
const mobileClient = createMobileAPIClient();

console.log('API client created successfully');