import { z } from 'zod';

export const registerClinicSchema = z.object({
  body: z.object({
    clinicName: z.string().min(2, 'Clinic name must be at least 2 characters'),
    clinicCode: z
      .string()
      .min(3, 'Clinic code must be at least 3 characters')
      .max(20, 'Clinic code cannot exceed 20 characters')
      .regex(/^[a-zA-Z0-9-]+$/, 'Clinic code can only contain letters, numbers, and hyphens'),
    clinicEmail: z.string().email('Invalid clinic email address'),
    clinicPhone: z.string().min(8, 'Valid phone number required'),
    ownerName: z.string().min(2, 'Owner name required'),
    ownerEmail: z.string().email('Invalid owner email address'),
    ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
    ownerPhone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    clinicCode: z.string().min(1, 'Clinic code is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required')
  })
});
