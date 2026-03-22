import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Loan, LoanDetail, LoanInstallment } from './useLoans';

interface CreateLoanPayload {
  borrowerName: string;
  borrowerContact?: string;
  principal: number;
  currency: string;
  numberOfInstallments: number;
  deliveryMethod: string;
  loanDate: string;
  notes?: string;
}

interface UpdateLoanPayload {
  borrowerName?: string;
  borrowerContact?: string;
  notes?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
}

interface PayInstallmentPayload {
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes?: string;
}

export function useLoanForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLoan = useCallback(async (payload: CreateLoanPayload): Promise<LoanDetail | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/loans', payload);
      return data.data as LoanDetail;
    } catch {
      setError('No se pudo crear el préstamo');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateLoan = useCallback(async (id: string, payload: UpdateLoanPayload): Promise<Loan | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/loans/${id}`, payload);
      return data.data as Loan;
    } catch {
      setError('No se pudo actualizar el préstamo');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const payInstallment = useCallback(async (
    loanId: string,
    installmentId: string,
    payload: PayInstallmentPayload
  ): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.post(`/loans/${loanId}/installments/${installmentId}/pay`, payload);
      return true;
    } catch {
      setError('No se pudo registrar el pago');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createLoan, updateLoan, payInstallment };
}
