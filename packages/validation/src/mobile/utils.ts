import { z } from 'zod';
import { Platform } from 'react-native';

// Mobile-specific validation helpers
export const mobileValidation = {
  // Validate phone number with device region
  phoneWithRegion: (defaultRegion = 'PL') => {
    return z.string().refine(phone => {
      // Simple validation for demo - in production use libphonenumber
      if (defaultRegion === 'PL') {
        return /^(\+48)?[\s-]?(\d{3}[\s-]?\d{3}[\s-]?\d{3}|\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})$/.test(phone);
      }
      // Add more regions as needed
      return true;
    }, 'Invalid phone number for your region');
  },
  
  // Validate file size for mobile uploads
  mobileFileSize: (maxSizeMB = 10) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return z.number().max(maxBytes, `File size must be less than ${maxSizeMB}MB`);
  },
  
  // Validate image dimensions for mobile
  mobileImageDimensions: (maxWidth = 4096, maxHeight = 4096) => {
    return z.object({
      width: z.number().max(maxWidth),
      height: z.number().max(maxHeight),
    });
  },
  
  // Validate GPS coordinates with accuracy
  gpsLocation: (minAccuracy = 100) => {
    return z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().max(minAccuracy, `Location accuracy must be within ${minAccuracy} meters`),
      timestamp: z.number(),
    });
  },
  
  // Validate device-specific constraints
  deviceConstraints: () => {
    return z.object({
      platform: z.enum(['ios', 'android']),
      version: z.string(),
      minVersion: z.string().optional(),
    }).refine(data => {
      if (data.minVersion) {
        // Simple version comparison
        return data.version >= data.minVersion;
      }
      return true;
    }, 'App version is too old');
  },
};

// Format validation errors for mobile display
export function formatMobileError(error: string): string {
  // Make errors more user-friendly for mobile
  const replacements: Record<string, string> = {
    'String must contain at least': 'Must be at least',
    'Invalid email': 'Please enter a valid email',
    'Required': 'This field is required',
    'Invalid phone number': 'Please enter a valid phone number',
  };
  
  let formatted = error;
  Object.entries(replacements).forEach(([search, replace]) => {
    if (formatted.includes(search)) {
      formatted = formatted.replace(search, replace);
    }
  });
  
  return formatted;
}

// Validation error messages for mobile
export const mobileErrorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must be at least 8 characters',
  passwordMatch: 'Passwords do not match',
  networkError: 'Please check your internet connection',
  locationError: 'Unable to get your location',
  cameraError: 'Camera access is required',
  fileError: 'Unable to process file',
};

// Platform-specific validation
export function getPlatformValidation() {
  if (Platform.OS === 'ios') {
    return {
      minOSVersion: 13,
      supportedFileTypes: ['.jpg', '.png', '.heic', '.pdf'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
    };
  } else if (Platform.OS === 'android') {
    return {
      minOSVersion: 21, // Android 5.0
      supportedFileTypes: ['.jpg', '.png', '.pdf'],
      maxFileSize: 25 * 1024 * 1024, // 25MB
    };
  }
  
  return {
    minOSVersion: 0,
    supportedFileTypes: ['.jpg', '.png', '.pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };
}

// Offline validation queue
export class OfflineValidationQueue {
  private queue: Array<{
    id: string;
    data: any;
    schema: z.ZodSchema;
    timestamp: number;
  }> = [];
  
  add(id: string, data: any, schema: z.ZodSchema): void {
    this.queue.push({
      id,
      data,
      schema,
      timestamp: Date.now(),
    });
  }
  
  async processQueue(): Promise<Array<{ id: string; valid: boolean; errors?: any }>> {
    const results = [];
    
    for (const item of this.queue) {
      const result = await item.schema.safeParseAsync(item.data);
      results.push({
        id: item.id,
        valid: result.success,
        errors: result.success ? undefined : result.error.format(),
      });
    }
    
    this.queue = [];
    return results;
  }
  
  clear(): void {
    this.queue = [];
  }
  
  get size(): number {
    return this.queue.length;
  }
}