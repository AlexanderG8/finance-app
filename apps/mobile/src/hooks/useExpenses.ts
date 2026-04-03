import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  date: string;
  isRecurring: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    createdAt: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ExpensesFilters {
  month?: number;
  year?: number;
  categoryId?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (filters: ExpensesFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.month) params.append('month', String(filters.month));
      if (filters.year) params.append('year', String(filters.year));
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      params.append('page', String(filters.page ?? 1));
      params.append('limit', String(filters.limit ?? 20));

      const { data } = await apiClient.get(`/expenses?${params.toString()}`);
      setExpenses(data.data);
      setPagination(data.pagination);
    } catch {
      setError('No se pudieron cargar los gastos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { expenses, pagination, isLoading, error, fetchExpenses, deleteExpense };
}
