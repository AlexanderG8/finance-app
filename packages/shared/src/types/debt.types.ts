import type { Currency, PaymentMethod } from './expense.types';

export type DebtStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type DebtType = 'CASH' | 'CREDIT';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface PersonalDebt {
  id: string;
  userId: string;
  creditorName: string;
  totalAmount: number;
  paidAmount: number;
  currency: Currency;
  numberOfInstallments: number | null;
  dueDate: string | null;
  paymentMethod: PaymentMethod;
  debtType: DebtType;
  status: DebtStatus;
  notes: string | null;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}
