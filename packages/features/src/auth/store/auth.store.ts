import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  UnifiedUser, 
  UnifiedAuthResponse, 
  LoginRequest, 
  RegisterRequest 
} from '@repo/shared/types';
import type { UnifiedAuthService } from '@repo/auth';
import { storage } from '@repo/shared/storage';

/**
 * Auth state interface
 */
export interface AuthState {
  // User data
  user: UnifiedUser | null;
  isAuthenticated: boolean;
  
  // Loading states
  isLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isRefreshLoading: boolean;
  
  // Error states
  error: string | null;
  loginError: string | null;
  
  // Session data
  accessToken: string | null;
  refreshToken: string | null;
  sessionExpiry: Date | null;
  
  // Platform info
  platform: 'web' | 'mobile';
  isOnline: boolean;
}

/**
 * Auth actions interface
 */
export interface AuthActions {
  // Authentication actions
  login: (request: LoginRequest) => Promise<UnifiedAuthResponse>;
  logout: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<UnifiedAuthResponse>;
  refreshToken: () => Promise<UnifiedAuthResponse>;
  
  // User actions
  updateUser: (user: Partial<UnifiedUser>) => void;
  getCurrentUser: () => Promise<UnifiedUser | null>;
  
  // State management
  setUser: (user: UnifiedUser | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Session management
  checkAuthStatus: () => Promise<boolean>;
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Platform detection
  setPlatform: (platform: 'web' | 'mobile') => void;
}

/**
 * Combined auth store type
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Storage adapter for Zustand persistence
 */
const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await storage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await storage.removeItem(name);
  },
};

/**
 * Unified Auth Store
 * Manages authentication state across web and mobile platforms
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoginLoading: false,
      isLogoutLoading: false,
      isRefreshLoading: false,
      error: null,
      loginError: null,
      accessToken: null,
      refreshToken: null,
      sessionExpiry: null,
      platform: typeof window !== 'undefined' && !('expo' in (globalThis as any)) ? 'web' : 'mobile',
      isOnline: true,

      // Authentication actions
      login: async (request: LoginRequest) => {
        set((state) => {
          state.isLoginLoading = true;
          state.loginError = null;
          state.error = null;
        });

        try {
          const authService = get().getAuthService();
          const response = await authService.login(request);

          if (response.success && response.user) {
            set((state) => {
              state.user = response.user!;
              state.isAuthenticated = true;
              state.accessToken = response.accessToken || null;
              state.refreshToken = response.refreshToken || null;
              state.sessionExpiry = response.expiresIn 
                ? new Date(Date.now() + response.expiresIn * 1000)
                : null;
              state.isLoginLoading = false;
            });
          } else {
            set((state) => {
              state.loginError = response.error || 'Login failed';
              state.isLoginLoading = false;
            });
          }

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set((state) => {
            state.loginError = errorMessage;
            state.isLoginLoading = false;
          });
          
          return {
            success: false,
            error: errorMessage,
          };
        }
      },

      logout: async () => {
        set((state) => {
          state.isLogoutLoading = true;
          state.error = null;
        });

        try {
          const authService = get().getAuthService();
          await authService.logout();

          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionExpiry = null;
            state.isLogoutLoading = false;
            state.error = null;
            state.loginError = null;
          });
        } catch (error) {
          console.error('Logout error:', error);
          // Clear state anyway
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionExpiry = null;
            state.isLogoutLoading = false;
          });
        }
      },

      register: async (request: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const authService = get().getAuthService();
          const response = await authService.register(request);

          if (response.success && response.user) {
            set((state) => {
              state.user = response.user!;
              state.isAuthenticated = true;
              state.accessToken = response.accessToken || null;
              state.refreshToken = response.refreshToken || null;
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = response.error || 'Registration failed';
              state.isLoading = false;
            });
          }

          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          
          return {
            success: false,
            error: errorMessage,
          };
        }
      },

      refreshToken: async () => {
        set((state) => {
          state.isRefreshLoading = true;
        });

        try {
          const authService = get().getAuthService();
          const response = await authService.refreshToken();

          if (response.success) {
            set((state) => {
              state.accessToken = response.accessToken || state.accessToken;
              state.refreshToken = response.refreshToken || state.refreshToken;
              state.sessionExpiry = response.expiresIn 
                ? new Date(Date.now() + response.expiresIn * 1000)
                : state.sessionExpiry;
              state.isRefreshLoading = false;
            });
          } else {
            // Refresh failed, logout user
            await get().logout();
          }

          return response;
        } catch (error) {
          console.error('Token refresh error:', error);
          await get().logout();
          
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Token refresh failed',
          };
        }
      },

      // User actions
      updateUser: (userData: Partial<UnifiedUser>) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...userData };
          }
        });
      },

      getCurrentUser: async () => {
        try {
          const authService = get().getAuthService();
          const user = await authService.getCurrentUser();
          
          if (user) {
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
            });
          }
          
          return user;
        } catch (error) {
          console.error('Get current user error:', error);
          return null;
        }
      },

      // State management
      setUser: (user: UnifiedUser | null) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      setTokens: (accessToken: string | null, refreshToken: string | null) => {
        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
          state.loginError = null;
        });
      },

      checkAuthStatus: async () => {
        try {
          const authService = get().getAuthService();
          const isAuthenticated = await authService.isAuthenticated();
          
          if (isAuthenticated) {
            const user = await authService.getCurrentUser();
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
            });
          } else {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.accessToken = null;
              state.refreshToken = null;
            });
          }
          
          return isAuthenticated;
        } catch (error) {
          console.error('Auth status check error:', error);
          return false;
        }
      },

      setOnlineStatus: (isOnline: boolean) => {
        set((state) => {
          state.isOnline = isOnline;
        });
      },

      setPlatform: (platform: 'web' | 'mobile') => {
        set((state) => {
          state.platform = platform;
        });
      },

      // Helper method to get auth service (implemented in hooks)
      getAuthService: () => {
        // This will be injected by the auth hooks
        throw new Error('Auth service not initialized. Use useAuth hook.');
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        platform: state.platform,
      }),
    }
  )
);

// Selector hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => ({
  isLoading: state.isLoading,
  isLoginLoading: state.isLoginLoading,
  isLogoutLoading: state.isLogoutLoading,
  isRefreshLoading: state.isRefreshLoading,
}));
export const useAuthErrors = () => useAuthStore((state) => ({
  error: state.error,
  loginError: state.loginError,
}));