import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Income } from './useIncomes';

interface IncomePayload {
  description: string;
  amount: number;
  currency: string;
  source: string;
  paymentMethod: string;
  date: string;
  isRecurring: boolean;
  notes?: string;
}

export function useIncomeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIncome = useCallback(async (payload: IncomePayload): Promise<Income | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/incomes', payload);
      return data.data as Income;
    } catch {
      setError('No se pudo crear el ingreso');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateIncome = useCallback(async (id: string, payload: Partial<IncomePayload>): Promise<Income | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/incomes/${id}`, payload);
      return data.data as Income;
    } catch {
      setError('No se pudo actualizar el ingreso');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createIncome, updateIncome };
}
