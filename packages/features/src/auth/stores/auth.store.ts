import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UnifiedUserDTO } from '@repo/shared/types';

export interface AuthState {
  user: UnifiedUserDTO | null;
  isAuthenticated: boolean;
  setUser: (user: UnifiedUserDTO) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<UnifiedUserDTO>) => void;
}

// Platform-agnostic storage
const getStorage = () => {
  if (typeof window !== 'undefined') {
    // Use localStorage for web
    return localStorage;
  }
  // For mobile, we'll handle storage differently in the mobile app
  return {
    getItem: (name: string) => null,
    setItem: (name: string, value: string) => {},
    removeItem: (name: string) => {},
  };
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true 
      }),
      
      clearUser: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => getStorage() as any),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);