import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Expense } from './useExpenses';

interface ExpensePayload {
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  creditCardId?: string | null;
  date: string;
  isRecurring: boolean;
  notes?: string;
}

export function useExpenseForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(async (payload: ExpensePayload): Promise<Expense | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/expenses', payload);
      return data.data as Expense;
    } catch {
      setError('No se pudo crear el gasto');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, payload: Partial<ExpensePayload>): Promise<Expense | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/expenses/${id}`, payload);
      return data.data as Expense;
    } catch {
      setError('No se pudo actualizar el gasto');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createExpense, updateExpense };
}
