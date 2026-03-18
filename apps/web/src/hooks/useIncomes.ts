'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Income, IncomeSummary } from '@finance-app/shared';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface IncomeFilters {
  month?: number;
  year?: number;
  source?: string;
  page?: number;
  limit?: number;
}

interface UseIncomesResult {
  incomes: Income[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseIncomeSummaryResult {
  summary: IncomeSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type CreateIncomeInput = {
  description: string;
  amount: number;
  currency: string;
  source: string;
  paymentMethod: string;
  date: string;
  isRecurring: boolean;
  notes?: string;
};

type UpdateIncomeInput = CreateIncomeInput & { id: string };

interface UseMutationResult<T> {
  isLoading: boolean;
  error: string | null;
  execute: (data: T) => Promise<Income | null>;
}

interface UseDeleteResult {
  isLoading: boolean;
  error: string | null;
  execute: (id: string) => Promise<boolean>;
}

export function useIncomes(filters: IncomeFilters = {}): UseIncomesResult {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchIncomes() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.month !== undefined) params.set('month', String(filters.month));
        if (filters.year !== undefined) params.set('year', String(filters.year));
        if (filters.source) params.set('source', filters.source);
        if (filters.page !== undefined) params.set('page', String(filters.page));
        if (filters.limit !== undefined) params.set('limit', String(filters.limit));

        const response = await apiClient.get<{
          success: true;
          data: Income[];
          pagination: Pagination;
        }>(`/incomes?${params.toString()}`);

        setIncomes(response.data.data);
        setPagination(response.data.pagination);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar los ingresos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchIncomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year, filters.source, filters.page, filters.limit, tick]);

  return { incomes, pagination, isLoading, error, refetch };
}

export function useIncomeSummary(month: number, year: number): UseIncomeSummaryResult {
  const [summary, setSummary] = useState<IncomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: IncomeSummary }>(
          `/incomes/summary/monthly?month=${month}&year=${year}`
        );
        setSummary(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el resumen de ingresos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [month, year, tick]);

  return { summary, isLoading, error, refetch };
}

export function useCreateIncome(): UseMutationResult<CreateIncomeInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: CreateIncomeInput): Promise<Income | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: Income }>('/incomes', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear el ingreso.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}

export function useUpdateIncome(): UseMutationResult<UpdateIncomeInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: UpdateIncomeInput): Promise<Income | null> => {
    const { id, ...rest } = data;
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.put<{ success: true; data: Income }>(
        `/incomes/${id}`,
        rest
      );
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al actualizar el ingreso.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}

export function useDeleteIncome(): UseDeleteResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/incomes/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar el ingreso.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}
