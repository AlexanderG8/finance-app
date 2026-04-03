import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface BudgetComparison {
  budget: {
    id: string;
    categoryId: string;
    amount: number;
    currency: string;
    month: number;
    year: number;
    category: {
      id: string;
      name: string;
      emoji: string;
      color: string;
    };
  };
  spent: number;
  remaining: number;
  percentage: number;
}

export function useBudgetComparison() {
  const [comparisons, setComparisons] = useState<BudgetComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async (month: number, year: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/budgets/comparison?month=${month}&year=${year}`);
      setComparisons(data.data);
    } catch {
      setError('No se pudo cargar el presupuesto');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { comparisons, isLoading, error, fetchComparison };
}
