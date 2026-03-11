import type { Currency, PaymentMethod } from './expense.types';

export type SavingGoalType = 'OBJECTIVE' | 'EMERGENCY' | 'CUSTOM';
export type SavingGoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface SavingContribution {
  id: string;
  goalId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  contributedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  type: SavingGoalType;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  targetDate: string | null;
  monthlyContribution: number | null;
  status: SavingGoalStatus;
  notes: string | null;
  contributions?: SavingContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingGoalProjection {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  remaining: number;
  isCompleted: boolean;
  projectedCompletionDate: string | null;
  monthsToComplete: number | null;
  monthlyContribution?: number;
  isOnTrack?: boolean | null;
  targetDate?: string | null;
}
