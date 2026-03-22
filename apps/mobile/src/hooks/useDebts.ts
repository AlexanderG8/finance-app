import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type DebtStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  creditorName: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  numberOfInstallments: number | null;
  dueDate: string | null;
  paymentMethod: string;
  status: DebtStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DebtDetail extends Debt {
  payments: DebtPayment[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DebtsFilters {
  status?: DebtStatus;
  page?: number;
  limit?: number;
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async (filters: DebtsFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      params.append('page', String(filters.page ?? 1));
      params.append('limit', String(filters.limit ?? 20));

      const { data } = await apiClient.get(`/debts?${params.toString()}`);
      setDebts(data.data);
      setPagination(data.pagination);
    } catch {
      setError('No se pudieron cargar las deudas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDebt = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/debts/${id}`);
      setDebts((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { debts, pagination, isLoading, error, fetchDebts, deleteDebt };
}

export function useDebtDetail() {
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebt = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/debts/${id}`);
      setDebt(data.data);
    } catch {
      setError('No se pudo cargar la deuda');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { debt, isLoading, error, fetchDebt };
}
