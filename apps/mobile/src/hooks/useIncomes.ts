import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type IncomeSource = 'SALARY' | 'FREELANCE' | 'BUSINESS' | 'INVESTMENT' | 'RENTAL' | 'OTHER';

export interface Income {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  source: IncomeSource;
  paymentMethod: string;
  date: string;
  isRecurring: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface IncomesFilters {
  month?: number;
  year?: number;
  source?: IncomeSource;
  page?: number;
  limit?: number;
}

export function useIncomes() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomes = useCallback(async (filters: IncomesFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.month) params.append('month', String(filters.month));
      if (filters.year) params.append('year', String(filters.year));
      if (filters.source) params.append('source', filters.source);
      params.append('page', String(filters.page ?? 1));
      params.append('limit', String(filters.limit ?? 20));

      const { data } = await apiClient.get(`/incomes?${params.toString()}`);
      setIncomes(data.data);
      setPagination(data.pagination);
    } catch {
      setError('No se pudieron cargar los ingresos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteIncome = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/incomes/${id}`);
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { incomes, pagination, isLoading, error, fetchIncomes, deleteIncome };
}
