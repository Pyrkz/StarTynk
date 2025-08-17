import { MMKV } from 'react-native-mmkv';

// Create MMKV instance for auth storage
const authStorage = new MMKV({
  id: 'auth-storage',
  encryptionKey: 'your-encryption-key', // TODO: Generate secure key
});

// Storage adapter for Zustand
export const mmkvStorageAdapter = {
  getItem: (name: string) => {
    const value = authStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    authStorage.set(name, value);
  },
  removeItem: (name: string) => {
    authStorage.delete(name);
  },
};