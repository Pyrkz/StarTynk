// TODO: Replace with @repo/shared after consolidation
// import { apiClient } from './api-client';
import { networkMonitor } from './network-monitor';
// TODO: Replace with @repo/shared after consolidation
// import { tokenStorage } from './storage/token-storage';
import { authService } from '../services/auth.service';
import { initializeMonitoring } from './monitoring';
import { mmkvStorageAdapter } from './storage/mmkv-storage';
import { setMobileStorage } from '@repo/features/auth/stores/auth.store.mobile';

export async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 Starting app initialization...');
    
    // Initialize MMKV storage for auth
    console.log('🔧 Setting up mobile storage...');
    setMobileStorage(mmkvStorageAdapter);
    console.log('✅ Mobile storage initialized');
    
    // Initialize monitoring (crash reporting, etc.)
    console.log('📊 Initializing monitoring...');
    initializeMonitoring();

    // Initialize network monitoring
    console.log('🌐 Initializing network monitoring...');
    await networkMonitor.initialize();

    // Check for existing session
    console.log('🔍 Checking for existing session...');
    try {
      const isAuthenticated = await authService.isAuthenticated();
      console.log('🔐 Authentication status:', isAuthenticated);
      
      if (isAuthenticated) {
        // Preload user data
        console.log('👤 Preloading user data...');
        await authService.getCurrentUser();
      }
    } catch (authError) {
      console.warn('⚠️ Auth check failed during init:', authError);
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
    throw error; // Re-throw to prevent app from continuing with broken state
  }
}