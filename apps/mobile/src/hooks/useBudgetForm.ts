import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface BudgetPayload {
  categoryId: string;
  amount: number;
  currency: string;
  month: number;
  year: number;
}

export function useBudgetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertBudget = useCallback(async (payload: BudgetPayload): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post('/budgets', payload);
      return true;
    } catch {
      setError('No se pudo guardar el presupuesto');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteBudget = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/budgets/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isSubmitting, error, upsertBudget, deleteBudget };
}
