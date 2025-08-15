import { apiClient } from './api-client';
import { networkMonitor } from './network-monitor';
import { tokenStorage } from './storage/token-storage';
import { authService } from '../services/auth.service';

export async function initializeApp(): Promise<void> {
  try {
    // Initialize network monitoring
    await networkMonitor.initialize();

    // Check for existing session
    const isAuthenticated = await authService.isAuthenticated();
    
    if (isAuthenticated) {
      // Preload user data
      await authService.getCurrentUser();
    }

    // Set up global error handler for auth
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:expired', () => {
        // Handle session expiry - navigate to login
        console.log('Session expired, redirecting to login...');
      });
    }

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
}