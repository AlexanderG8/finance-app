import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Debt, DebtPayment } from './useDebts';

interface DebtPayload {
  creditorName: string;
  totalAmount: number;
  currency: string;
  numberOfInstallments?: number;
  dueDate?: string;
  paymentMethod: string;
  notes?: string;
}

interface PayDebtPayload {
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes?: string;
}

export function useDebtForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDebt = useCallback(async (payload: DebtPayload): Promise<Debt | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/debts', payload);
      return data.data as Debt;
    } catch {
      setError('No se pudo crear la deuda');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateDebt = useCallback(async (id: string, payload: Partial<DebtPayload>): Promise<Debt | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/debts/${id}`, payload);
      return data.data as Debt;
    } catch {
      setError('No se pudo actualizar la deuda');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const payDebt = useCallback(async (id: string, payload: PayDebtPayload): Promise<DebtPayment | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post(`/debts/${id}/pay`, payload);
      return data.data as DebtPayment;
    } catch {
      setError('No se pudo registrar el pago');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createDebt, updateDebt, payDebt };
}
