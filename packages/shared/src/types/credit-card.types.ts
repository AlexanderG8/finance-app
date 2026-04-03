import type { Currency } from './expense.types';
import type { Expense } from './expense.types';

export interface CreditCard {
  id: string;
  userId: string;
  entityName: string;
  cycleStartDay: number;
  paymentDueDay: number;
  currency: Currency;
  creditLimit: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardCycleSummary {
  card: CreditCard;
  cycleStart: string;
  cycleEnd: string;
  paymentDueDate: string;
  daysUntilPayment: number;
  totalSpent: number;
  creditLimit: number | null;
  usagePercentage: number | null;
  expenses: Expense[];
}
