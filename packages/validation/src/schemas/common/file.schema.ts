import { z } from 'zod';

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .max(255)
    .regex(/^[^<>:"/\\|?*]+$/, 'Filename contains invalid characters'),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  buffer: z.instanceof(Buffer).optional(),
}).refine(file => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  return allowedTypes.includes(file.mimetype);
}, 'File type not allowed');

// Image upload with specific constraints
export const imageUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024), // 5MB max for images
  width: z.number().min(100).max(4096).optional(),
  height: z.number().min(100).max(4096).optional(),
});

// Document upload
export const documentUploadSchema = z.object({
  filename: z.string().max(255),
  mimetype: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
  size: z.number().max(20 * 1024 * 1024), // 20MB max for documents
  pages: z.number().min(1).optional(),
});

// File reference (for stored files)
export const fileReferenceSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimetype: z.string(),
  size: z.number(),
  url: z.string().url(),
  uploadedAt: z.coerce.date(),
  uploadedBy: z.string().uuid(),
});

// Multiple file upload
export const multipleFileUploadSchema = z.object({
  files: z.array(fileUploadSchema).min(1).max(10),
  totalSize: z.number().max(50 * 1024 * 1024), // 50MB total
});