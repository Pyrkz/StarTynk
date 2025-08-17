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

// This will be set by the mobile app
let mobileStorage: any = null;

export const setMobileStorage = (storage: any) => {
  mobileStorage = storage;
  console.log('🔧 Mobile storage set:', !!storage);
};

// Fallback storage for when mobile storage isn't initialized
const fallbackStorage = {
  getItem: (name: string) => {
    console.log('⚠️ Using fallback storage for getItem:', name);
    return null;
  },
  setItem: (name: string, value: string) => {
    console.log('⚠️ Using fallback storage for setItem:', name);
  },
  removeItem: (name: string) => {
    console.log('⚠️ Using fallback storage for removeItem:', name);
  },
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => {
        console.log('📱 Setting user in mobile store:', user?.id);
        set({ 
          user, 
          isAuthenticated: true 
        });
      },
      
      clearUser: () => {
        console.log('📱 Clearing user in mobile store');
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        const storage = mobileStorage || fallbackStorage;
        console.log('📱 Using storage:', !!mobileStorage ? 'MMKV' : 'fallback');
        return storage;
      }),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);