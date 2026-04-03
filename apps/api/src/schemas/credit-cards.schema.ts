import { z } from 'zod';

export const createCreditCardSchema = z.object({
  entityName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  cycleStartDay: z
    .number()
    .int()
    .min(1, 'El día de inicio debe estar entre 1 y 28.')
    .max(28, 'El día de inicio debe estar entre 1 y 28.'),
  paymentDueDay: z
    .number()
    .int()
    .min(1, 'El día de pago debe estar entre 1 y 28.')
    .max(28, 'El día de pago debe estar entre 1 y 28.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  creditLimit: z
    .number()
    .positive('El límite debe ser mayor a 0.')
    .multipleOf(0.01)
    .optional(),
  notes: z.string().max(500).optional(),
});

export const updateCreditCardSchema = createCreditCardSchema.partial();

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
