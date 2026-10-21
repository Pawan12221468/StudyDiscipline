import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' })
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' })
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
