'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Budget, BudgetComparison } from '@finance-app/shared';

interface UseBudgetsResult {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseBudgetComparisonResult {
  comparison: BudgetComparison[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UpsertBudgetInput {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  currency: string;
}

interface UseUpsertBudgetResult {
  isLoading: boolean;
  error: string | null;
  execute: (data: UpsertBudgetInput) => Promise<Budget | null>;
}

interface UseDeleteBudgetResult {
  isLoading: boolean;
  error: string | null;
  execute: (id: string) => Promise<boolean>;
}

export function useBudgets(month: number, year: number): UseBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchBudgets() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: Budget[] }>(
          `/budgets?month=${month}&year=${year}`
        );
        setBudgets(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar los presupuestos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBudgets();
  }, [month, year, tick]);

  return { budgets, isLoading, error, refetch };
}

export function useBudgetComparison(month: number, year: number): UseBudgetComparisonResult {
  const [comparison, setComparison] = useState<BudgetComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchComparison() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: BudgetComparison[] }>(
          `/budgets/comparison?month=${month}&year=${year}`
        );
        setComparison(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar la comparativa de presupuesto.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparison();
  }, [month, year, tick]);

  return { comparison, isLoading, error, refetch };
}

export function useUpsertBudget(): UseUpsertBudgetResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: UpsertBudgetInput): Promise<Budget | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: Budget }>('/budgets', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al guardar el presupuesto.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}

export function useDeleteBudget(): UseDeleteBudgetResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/budgets/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar el presupuesto.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
}
