import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { IncomeSource } from './useIncomes';

interface SourceSummary {
  source: IncomeSource;
  total: number;
  count: number;
}

interface IncomeSummary {
  month: number;
  year: number;
  totalAmount: number;
  bySource: SourceSummary[];
}

export function useIncomeSummary() {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (month: number, year: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/incomes/summary/monthly?month=${month}&year=${year}`);
      setSummary(data.data);
    } catch {
      setError('No se pudo cargar el resumen de ingresos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, fetchSummary };
}
