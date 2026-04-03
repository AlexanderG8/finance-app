import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { SavingGoal, SavingContribution, GoalType, GoalStatus } from './useSavings';

interface CreateGoalPayload {
  name: string;
  type: GoalType;
  targetAmount: number;
  currency: string;
  targetDate?: string;
  monthlyContribution?: number;
  notes?: string;
}

interface UpdateGoalPayload {
  name?: string;
  type?: GoalType;
  targetAmount?: number;
  targetDate?: string | null;
  monthlyContribution?: number | null;
  status?: GoalStatus;
  notes?: string;
}

interface ContributePayload {
  amount: number;
  paymentMethod: string;
  contributedAt: string;
  notes?: string;
}

export function useSavingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCallback(async (payload: CreateGoalPayload): Promise<SavingGoal | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/savings', payload);
      return data.data as SavingGoal;
    } catch {
      setError('No se pudo crear la meta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateGoal = useCallback(async (id: string, payload: UpdateGoalPayload): Promise<SavingGoal | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/savings/${id}`, payload);
      return data.data as SavingGoal;
    } catch {
      setError('No se pudo actualizar la meta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const contribute = useCallback(async (id: string, payload: ContributePayload): Promise<SavingContribution | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post(`/savings/${id}/contribute`, payload);
      return data.data as SavingContribution;
    } catch {
      setError('No se pudo registrar el aporte');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createGoal, updateGoal, contribute };
}
