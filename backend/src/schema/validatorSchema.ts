import * as z from 'zod';
/**
 * shared auth schemas used in BOTH frontend + backend
 */

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .pipe(z.email({ error: 'Invalid email address' })),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
