import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface UpcomingPayment {
  type: 'loan' | 'debt';
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export function useUpcomingPayments() {
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/dashboard/upcoming-payments');
      const { loanInstallments = [], debts = [] } = data.data ?? {};

      const now = new Date();

      const loanPayments: UpcomingPayment[] = loanInstallments.map(
        (i: { id: string; loan: { borrowerName: string }; amount: number; dueDate: string }) => ({
          type: 'loan' as const,
          id: i.id,
          name: i.loan.borrowerName,
          amount: i.amount,
          dueDate: i.dueDate,
          daysUntilDue: Math.ceil(
            (new Date(i.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })
      );

      const debtPayments: UpcomingPayment[] = debts.map(
        (d: { id: string; creditorName: string; totalAmount: number; paidAmount: number; dueDate: string }) => ({
          type: 'debt' as const,
          id: d.id,
          name: d.creditorName,
          amount: d.totalAmount - d.paidAmount,
          dueDate: d.dueDate,
          daysUntilDue: Math.ceil(
            (new Date(d.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        })
      );

      const combined = [...loanPayments, ...debtPayments].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      setPayments(combined);
    } catch {
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { payments, isLoading, fetchPayments };
}
