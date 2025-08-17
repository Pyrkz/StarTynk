import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatyczne wykrywanie odpowiedniego URL dla różnych środowisk
const getApiBaseUrl = () => {
  // Sprawdź czy jest to emulator/symulator
  const isEmulator = Constants.isDevice === false;
  
  // Dla development
  if (__DEV__) {
    // Android Emulator
    if (Platform.OS === 'android' && isEmulator) {
      console.log('Detected: Android Emulator');
      return 'http://10.0.2.2:3000/api';
    }
    // iOS Simulator
    else if (Platform.OS === 'ios' && isEmulator) {
      console.log('Detected: iOS Simulator');
      return 'http://localhost:3000/api';
    }
    // Fizyczne urządzenie (Android lub iOS)
    else {
      console.log('Detected: Physical Device');
      // WAŻNE: Upewnij się że to jest Twój lokalny IP
      return 'http://192.168.1.31:3000/api';
    }
  }
  
  // Dla produkcji
  return 'https://api.startynk.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Szczegółowe debugowanie
console.log('=== API Configuration ===');
console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);
console.log('Is Device:', Constants.isDevice);
console.log('Development mode:', __DEV__);
console.log('========================');