import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type GoalType = 'OBJECTIVE' | 'EMERGENCY' | 'CUSTOM';
export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface SavingContribution {
  id: string;
  goalId: string;
  amount: number;
  paymentMethod: string;
  contributedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  monthlyContribution: number | null;
  status: GoalStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingGoalDetail extends SavingGoal {
  contributions: SavingContribution[];
}

export interface SavingProjection {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  remaining: number;
  isCompleted: boolean;
  projectedCompletionDate: string | null;
  monthsToComplete: number | null;
  monthlyContribution: number | null;
  isOnTrack: boolean | null;
  targetDate: string | null;
}

export function useSavings() {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get('/savings');
      setGoals(data.data);
    } catch {
      setError('No se pudieron cargar las metas de ahorro');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/savings/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { goals, isLoading, error, fetchGoals, deleteGoal };
}

export function useSavingDetail() {
  const [goal, setGoal] = useState<SavingGoalDetail | null>(null);
  const [projection, setProjection] = useState<SavingProjection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const [detailRes, projRes] = await Promise.all([
        apiClient.get(`/savings/${id}`),
        apiClient.get(`/savings/${id}/projection`),
      ]);
      setGoal(detailRes.data.data);
      setProjection(projRes.data.data);
    } catch {
      setError('No se pudo cargar la meta de ahorro');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { goal, projection, isLoading, error, fetchGoal };
}
