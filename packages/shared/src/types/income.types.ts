export type IncomeSource = 'SALARY' | 'FREELANCE' | 'BUSINESS' | 'INVESTMENT' | 'RENTAL' | 'OTHER';

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  SALARY: 'Salario',
  FREELANCE: 'Freelance',
  BUSINESS: 'Negocio',
  INVESTMENT: 'Inversión',
  RENTAL: 'Alquiler',
  OTHER: 'Otros',
};

export const INCOME_SOURCE_COLORS: Record<IncomeSource, string> = {
  SALARY: '#2E86AB',
  FREELANCE: '#28A745',
  BUSINESS: '#F4A261',
  INVESTMENT: '#9B59B6',
  RENTAL: '#1ABC9C',
  OTHER: '#95A5A6',
};

export interface Income {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: 'PEN' | 'USD';
  source: IncomeSource;
  paymentMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';
  date: string;
  isRecurring: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSummary {
  month: number;
  year: number;
  totalAmount: number;
  bySource: Array<{ source: IncomeSource; total: number; count: number }>;
}
