import { z } from 'zod';

const LOAN_PAYMENT_METHODS = ['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH'] as const;

export const createLoanSchema = z.object({
  borrowerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  borrowerContact: z
    .string()
    .max(100, 'El contacto no puede exceder 100 caracteres.')
    .optional(),
  principal: z
    .number()
    .positive('El monto principal debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  currency: z.enum(['PEN', 'USD']).default('PEN'),
  numberOfInstallments: z
    .number()
    .int('El número de cuotas debe ser entero.')
    .min(1, 'Debe haber al menos 1 cuota.')
    .max(60, 'El máximo es 60 cuotas.'),
  deliveryMethod: z.enum(LOAN_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de entrega inválido. Opciones: YAPE, PLIN, BANK_TRANSFER, CASH.',
    }),
  }),
  loanDate: z.string().datetime('Fecha de préstamo inválida.'),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres.').optional(),
});

export const updateLoanSchema = z.object({
  borrowerName: z.string().min(2).max(100).optional(),
  borrowerContact: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'OVERDUE']).optional(),
});

export const payInstallmentSchema = z.object({
  amount: z
    .number()
    .positive('El monto de pago debe ser positivo.')
    .multipleOf(0.01, 'El monto debe tener máximo 2 decimales.'),
  paymentMethod: z.enum(LOAN_PAYMENT_METHODS, {
    errorMap: () => ({
      message: 'Método de pago inválido. Opciones: YAPE, PLIN, BANK_TRANSFER, CASH.',
    }),
  }),
  paidAt: z.string().datetime('Fecha de pago inválida.'),
  notes: z.string().max(500).optional(),
});

export const loanQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'OVERDUE']).optional(),
  borrowerName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type PayInstallmentInput = z.infer<typeof payInstallmentSchema>;
export type LoanQueryInput = z.infer<typeof loanQuerySchema>;
