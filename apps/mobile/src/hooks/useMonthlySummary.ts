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

interface MonthlySummary {
  month: number;
  year: number;
  totalAmount: number;
  byCategory: CategorySummary[];
}

export function useMonthlySummary() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (month: number, year: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/expenses/summary/monthly?month=${month}&year=${year}`);
      setSummary(data.data);
    } catch {
      setError('No se pudo cargar el resumen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, fetchSummary };
}
