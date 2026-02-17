import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Nieprawidłowy format email" })
    .max(255, { message: "Email nie może przekraczać 255 znaków" }),
  password: z.string()
    .min(6, { message: "Hasło musi mieć minimum 6 znaków" })
    .max(100, { message: "Hasło nie może przekraczać 100 znaków" }),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string()
    .trim()
    .max(100, { message: "Imię i nazwisko nie może przekraczać 100 znaków" })
    .optional()
    .or(z.literal('')),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
