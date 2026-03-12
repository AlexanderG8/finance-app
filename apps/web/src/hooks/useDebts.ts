'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PersonalDebt, DebtStatus } from '@finance-app/shared';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DebtFilters {
  status?: DebtStatus;
  page?: number;
  limit?: number;
}

interface UseDebtsResult {
  debts: PersonalDebt[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseDebtResult {
  debt: PersonalDebt | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type CreateDebtInput = {
  creditorName: string;
  totalAmount: number;
  currency: 'PEN' | 'USD';
  numberOfInstallments?: number;
  dueDate?: string;
  paymentMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';
  notes?: string;
};

type UpdateDebtInput = Partial<CreateDebtInput>;

type PayDebtInput = {
  amount: number;
  paymentMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';
  paidAt: string;
  notes?: string;
};

interface UseCreateDebtResult {
  createDebt: (data: CreateDebtInput) => Promise<PersonalDebt | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseUpdateDebtResult {
  updateDebt: (id: string, data: UpdateDebtInput) => Promise<PersonalDebt | null>;
  isLoading: boolean;
  error: string | null;
}

interface UsePayDebtResult {
  payDebt: (id: string, data: PayDebtInput) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

interface UseDeleteDebtResult {
  deleteDebt: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useDebts(filters: DebtFilters = {}): UseDebtsResult {
  const [debts, setDebts] = useState<PersonalDebt[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchDebts() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.page !== undefined) params.set('page', String(filters.page));
        if (filters.limit !== undefined) params.set('limit', String(filters.limit));

        const response = await apiClient.get<{
          success: true;
          data: PersonalDebt[];
          pagination: Pagination;
        }>(`/debts?${params.toString()}`);

        setDebts(response.data.data);
        setPagination(response.data.pagination);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar las deudas.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.page, filters.limit, tick]);

  return { debts, pagination, isLoading, error, refetch };
}

export function useDebt(id: string): UseDebtResult {
  const [debt, setDebt] = useState<PersonalDebt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;

    async function fetchDebt() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: PersonalDebt }>(
          `/debts/${id}`
        );
        setDebt(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar la deuda.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDebt();
  }, [id, tick]);

  return { debt, isLoading, error, refetch };
}

export function useCreateDebt(): UseCreateDebtResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDebt = useCallback(async (data: CreateDebtInput): Promise<PersonalDebt | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: PersonalDebt }>('/debts', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear la deuda.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createDebt, isLoading, error };
}

export function useUpdateDebt(): UseUpdateDebtResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDebt = useCallback(
    async (id: string, data: UpdateDebtInput): Promise<PersonalDebt | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.put<{ success: true; data: PersonalDebt }>(
          `/debts/${id}`,
          data
        );
        return response.data.data;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al actualizar la deuda.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateDebt, isLoading, error };
}

export function usePayDebt(): UsePayDebtResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payDebt = useCallback(async (id: string, data: PayDebtInput): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.post(`/debts/${id}/pay`, data);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al registrar el pago.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { payDebt, isLoading, error };
}

export function useDeleteDebt(): UseDeleteDebtResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDebt = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/debts/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar la deuda.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteDebt, isLoading, error };
}
