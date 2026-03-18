import { z } from 'zod';

export const createIncomeSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(200),
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  source: z
    .enum(['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'RENTAL', 'OTHER'])
    .default('OTHER'),
  paymentMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  date: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const incomeQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  source: z
    .enum(['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'RENTAL', 'OTHER'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type IncomeQueryInput = z.infer<typeof incomeQuerySchema>;
