import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserDTO } from '@repo/shared/types';

export interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  setUser: (user: UserDTO) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<UserDTO>) => void;
}

// Platform-agnostic storage
const getStorage = () => {
  if (typeof window !== 'undefined') {
    // Check if React Native
    if ('expo' in window) {
      // Use AsyncStorage for React Native
      return {
        getItem: async (name: string) => {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.removeItem(name);
        },
      };
    }
    // Use localStorage for web
    return localStorage;
  }
  // Server-side rendering
  return undefined;
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
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);