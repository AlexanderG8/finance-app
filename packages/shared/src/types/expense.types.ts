export type Currency = 'PEN' | 'USD';
export type PaymentMethod = 'CREDIT_CARD' | 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';

export interface ExpenseCategory {
  id: string;
  userId: string | null;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  isUserCategory: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  creditCardId: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  date: string;
  isRecurring: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalAmount: number;
  byCategory: {
    category: Pick<ExpenseCategory, 'id' | 'name' | 'emoji' | 'color'>;
    total: number;
    count: number;
  }[];
}

export interface BudgetComparison {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}
