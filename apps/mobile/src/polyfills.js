// Polyfills for React Native and Web compatibility
import { Platform } from 'react-native';

// Only import React Native specific polyfills on mobile
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

// Import abort-controller polyfill for all platforms
if (typeof AbortController === 'undefined') {
  require('abortcontroller-polyfill/dist/abortcontroller-polyfill-only');
}

// Web-specific polyfills
if (Platform.OS === 'web') {
  // Polyfill for HMRClient if needed
  if (!global.HMRClient) {
    global.HMRClient = {
      setup: () => {},
      enable: () => {},
      disable: () => {},
    };
  }
}