import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface CategorySummary {
  category: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  total: number;
  count: number;
}

interface DashboardSummary {
  expenses: {
    total: number;
    byCategory: CategorySummary[];
  };
  income: {
    total: number;
  };
  debtPayments: {
    total: number;
  };
  balance: number;
  loans: {
    totalLent: number;
    totalCollected: number;
    totalPending: number;
    activeLoans: number;
    completedLoans: number;
    overdueLoans: number;
  };
  debts: {
    totalPending: number;
  };
  savings: {
    totalSaved: number;
    goalsCount: number;
  };
}

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get('/dashboard/summary');
      setSummary(data.data);
    } catch {
      setError('No se pudo cargar el resumen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, fetchSummary };
}
