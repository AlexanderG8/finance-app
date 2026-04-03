import { z } from 'zod';

const EXPENSE_PAYMENT_METHODS = ['CREDIT_CARD', 'YAPE', 'PLIN', 'CASH'] as const;

export const createExpenseSchema = z.object({
  categoryId: z.string().cuid('ID de categoría inválido.'),
  description: z
    .string()
    .min(1, 'La descripción es requerida.')
    .max(255, 'La descripción no puede exceder 255 caracteres.'),
  amount: z
    .number()
    .positive('El monto debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de pago inválido. Opciones: CREDIT_CARD, YAPE, PLIN, CASH.',
    }),
  }),
  date: z.string().datetime('Fecha inválida.'),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres.').optional(),
  creditCardId: z.string().cuid('ID de tarjeta inválido.').optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'YAPE', 'PLIN', 'CASH', 'BANK_TRANSFER']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createBudgetSchema = z.object({
  categoryId: z.string().cuid('ID de categoría inválido.'),
  amount: z
    .number()
    .positive('El monto debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
