import type { Currency, PaymentMethod } from './expense.types';

export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';

export interface LoanInstallment {
  id: string;
  loanId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  installmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerContact: string | null;
  principal: number;
  currency: Currency;
  interestRate: number;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  deliveryMethod: PaymentMethod;
  loanDate: string;
  status: LoanStatus;
  notes: string | null;
  installments?: LoanInstallment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  totalLent: number;
  totalCollected: number;
  totalPending: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
}
