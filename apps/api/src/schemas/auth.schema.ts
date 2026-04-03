import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(100, 'La contraseña no puede exceder 100 caracteres.'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es requerido.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(100, 'La contraseña no puede exceder 100 caracteres.'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.')
    .optional(),
  avatarUrl: z.string().url('URL de avatar inválida.').optional().nullable(),
  preferredCurrency: z.enum(['PEN', 'USD']).optional(),
  timezone: z.string().optional(),
});

export const pushTokenSchema = z.object({
  token: z.string().startsWith('ExponentPushToken[', 'Token de push inválido.').nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PushTokenInput = z.infer<typeof pushTokenSchema>;
