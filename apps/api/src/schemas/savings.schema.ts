import { z } from 'zod';

const SAVING_PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH'] as const;

export const createSavingGoalSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  type: z.enum(['OBJECTIVE', 'EMERGENCY', 'CUSTOM']).default('CUSTOM'),
  targetAmount: z
    .number()
    .positive('El monto objetivo debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  targetDate: z.string().datetime('Fecha objetivo inválida.').optional(),
  monthlyContribution: z
    .number()
    .positive('La contribución mensual debe ser positiva.')
    .multipleOf(0.01)
    .optional(),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres.').optional(),
});

export const updateSavingGoalSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(['OBJECTIVE', 'EMERGENCY', 'CUSTOM']).optional(),
  targetAmount: z.number().positive().multipleOf(0.01).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  monthlyContribution: z.number().positive().multipleOf(0.01).optional().nullable(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PAUSED']).optional(),
  notes: z.string().max(500).optional(),
});

export const contributeSchema = z.object({
  amount: z
    .number()
    .positive('El monto del aporte debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  paymentMethod: z.enum(SAVING_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de pago inválido. Solo se permiten: BANK_TRANSFER, CASH.',
    }),
  }),
  contributedAt: z.string().datetime('Fecha de aporte inválida.'),
  notes: z.string().max(500).optional(),
});

export type CreateSavingGoalInput = z.infer<typeof createSavingGoalSchema>;
export type UpdateSavingGoalInput = z.infer<typeof updateSavingGoalSchema>;
export type ContributeInput = z.infer<typeof contributeSchema>;
