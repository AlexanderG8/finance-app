'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Expense, MonthlySummary } from '@finance-app/shared';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ExpenseFilters {
  month?: number;
  year?: number;
  categoryId?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

interface UseExpensesResult {
  expenses: Expense[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMonthlySummaryResult {
  summary: MonthlySummary | null;
  isLoading: boolean;
  error: string | null;
}

interface UseExpenseResult {
  expense: Expense | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMutationResult<T> {
  isLoading: boolean;
  error: string | null;
  execute: (data: T) => Promise<Expense | null>;
}

interface UseDeleteResult {
  isLoading: boolean;
  error: string | null;
  execute: (id: string) => Promise<boolean>;
}

type CreateExpenseInput = {
  description: string;
  amount: number;
  categoryId: string;
  paymentMethod: string;
  date: string;
  currency: string;
  isRecurring: boolean;
  notes?: string;
};

type UpdateExpenseInput = CreateExpenseInput & { id: string };

export function useExpenses(filters: ExpenseFilters = {}): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.month !== undefined) params.set('month', String(filters.month));
        if (filters.year !== undefined) params.set('year', String(filters.year));
        if (filters.categoryId) params.set('categoryId', filters.categoryId);
        if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
        if (filters.page !== undefined) params.set('page', String(filters.page));
        if (filters.limit !== undefined) params.set('limit', String(filters.limit));

        const response = await apiClient.get<{
          success: true;
          data: Expense[];
          pagination: Pagination;
        }>(`/expenses?${params.toString()}`);

        setExpenses(response.data.data);
        setPagination(response.data.pagination);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar los gastos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.month,
    filters.year,
    filters.categoryId,
    filters.paymentMethod,
    filters.page,
    filters.limit,
    tick,
  ]);

  return { expenses, pagination, isLoading, error, refetch };
}

export function useMonthlySummary(month: number, year: number): UseMonthlySummaryResult {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: MonthlySummary }>(
          `/expenses/summary/monthly?month=${month}&year=${year}`
        );
        setSummary(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el resumen mensual.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [month, year]);

  return { summary, isLoading, error };
}

export function useExpense(id: string): UseExpenseResult {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;

    async function fetchExpense() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: Expense }>(`/expenses/${id}`);
        setExpense(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el gasto.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpense();
  }, [id, tick]);

  return { expense, isLoading, error, refetch };
}

export function useCreateExpense(): UseMutationResult<CreateExpenseInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: CreateExpenseInput): Promise<Expense | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: Expense }>('/expenses', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear el gasto.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}

export function useUpdateExpense(): UseMutationResult<UpdateExpenseInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: UpdateExpenseInput): Promise<Expense | null> => {
    const { id, ...rest } = data;
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.put<{ success: true; data: Expense }>(
        `/expenses/${id}`,
        rest
      );
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al actualizar el gasto.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}

export function useDeleteExpense(): UseDeleteResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/expenses/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar el gasto.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}
