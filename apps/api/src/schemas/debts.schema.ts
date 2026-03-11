import { z } from 'zod';

const DEBT_PAYMENT_METHODS = ['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH'] as const;

export const createDebtSchema = z.object({
  creditorName: z
    .string()
    .min(2, 'El nombre del acreedor debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  totalAmount: z
    .number()
    .positive('El monto total debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  numberOfInstallments: z.number().int().min(1).max(60).optional(),
  dueDate: z.string().datetime('Fecha de vencimiento inválida.').optional(),
  paymentMethod: z.enum(DEBT_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de pago inválido. Opciones: YAPE, PLIN, BANK_TRANSFER, CASH.',
    }),
  }),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres.').optional(),
});

export const updateDebtSchema = createDebtSchema.partial();

export const payDebtSchema = z.object({
  amount: z
    .number()
    .positive('El monto de pago debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  paymentMethod: z.enum(DEBT_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de pago inválido. Opciones: YAPE, PLIN, BANK_TRANSFER, CASH.',
    }),
  }),
  paidAt: z.string().datetime('Fecha de pago inválida.'),
  notes: z.string().max(500).optional(),
});

export const debtQuerySchema = z.object({
  status: z.enum(['PENDING', 'PARTIAL', 'PAID']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type PayDebtInput = z.infer<typeof payDebtSchema>;
export type DebtQueryInput = z.infer<typeof debtQuerySchema>;
