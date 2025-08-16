import { z } from 'zod';

// Coordinate validation
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  timestamp: z.coerce.date().optional(),
});

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1).max(255),
  buildingNumber: z.string().min(1).max(20),
  apartmentNumber: z.string().max(20).optional(),
  city: z.string().min(1).max(100),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Invalid Polish postal code'),
  province: z.string().min(1).max(100).optional(),
  country: z.string().length(2).default('PL'), // ISO country code
});

// Geofence for location validation
export const geofenceSchema = z.object({
  center: coordinateSchema,
  radius: z.number().min(10).max(5000), // meters
  name: z.string().min(1).max(100),
  type: z.enum(['circle', 'polygon']).default('circle'),
  polygon: z.array(coordinateSchema).min(3).optional(),
});

// Location check-in validation
export const locationCheckInSchema = z.object({
  location: coordinateSchema,
  geofence: geofenceSchema,
  timestamp: z.coerce.date(),
}).refine(data => {
  // Validate if location is within geofence
  if (data.geofence.type === 'circle') {
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      data.geofence.center.latitude,
      data.geofence.center.longitude
    );
    return distance <= data.geofence.radius;
  }
  // For polygon, would need more complex point-in-polygon check
  return true;
}, {
  message: 'Location is outside allowed area',
  path: ['location'],
});

// Helper function for distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}