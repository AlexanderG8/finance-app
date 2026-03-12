'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Loan, LoanInstallment, LoanSummary, LoanStatus } from '@finance-app/shared';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LoanFilters {
  status?: LoanStatus;
  borrowerName?: string;
  page?: number;
  limit?: number;
}

interface UseLoansResult {
  loans: Loan[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseLoanSummaryResult {
  summary: LoanSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseLoanResult {
  loan: Loan | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseLoanInstallmentsResult {
  installments: LoanInstallment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type CreateLoanInput = {
  borrowerName: string;
  borrowerContact?: string;
  principal: number;
  currency: 'PEN' | 'USD';
  numberOfInstallments: number;
  deliveryMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';
  loanDate: string;
  notes?: string;
};

type UpdateLoanInput = Partial<CreateLoanInput> & { id: string };

type PayInstallmentInput = {
  amount: number;
  paymentMethod: 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH';
  paidAt: string;
  notes?: string;
};

interface UseCreateLoanResult {
  createLoan: (data: CreateLoanInput) => Promise<Loan | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseUpdateLoanResult {
  updateLoan: (data: UpdateLoanInput) => Promise<Loan | null>;
  isLoading: boolean;
  error: string | null;
}

interface UsePayInstallmentResult {
  payInstallment: (
    loanId: string,
    installmentId: string,
    data: PayInstallmentInput
  ) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useLoans(filters: LoanFilters = {}): UseLoansResult {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchLoans() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.borrowerName) params.set('borrowerName', filters.borrowerName);
        if (filters.page !== undefined) params.set('page', String(filters.page));
        if (filters.limit !== undefined) params.set('limit', String(filters.limit));

        const response = await apiClient.get<{
          success: true;
          data: Loan[];
          pagination: Pagination;
        }>(`/loans?${params.toString()}`);

        setLoans(response.data.data);
        setPagination(response.data.pagination);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar los préstamos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.borrowerName, filters.page, filters.limit, tick]);

  return { loans, pagination, isLoading, error, refetch };
}

export function useLoanSummary(): UseLoanSummaryResult {
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: LoanSummary }>(
          '/loans/summary'
        );
        setSummary(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el resumen de préstamos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [tick]);

  return { summary, isLoading, error, refetch };
}

export function useLoan(id: string): UseLoanResult {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;

    async function fetchLoan() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: Loan }>(`/loans/${id}`);
        setLoan(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el préstamo.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLoan();
  }, [id, tick]);

  return { loan, isLoading, error, refetch };
}

export function useLoanInstallments(loanId: string): UseLoanInstallmentsResult {
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!loanId) return;

    async function fetchInstallments() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: LoanInstallment[] }>(
          `/loans/${loanId}/installments`
        );
        setInstallments(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar las cuotas.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInstallments();
  }, [loanId, tick]);

  return { installments, isLoading, error, refetch };
}

export function useCreateLoan(): UseCreateLoanResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLoan = useCallback(async (data: CreateLoanInput): Promise<Loan | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: Loan }>('/loans', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear el préstamo.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createLoan, isLoading, error };
}

export function useUpdateLoan(): UseUpdateLoanResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLoan = useCallback(async (data: UpdateLoanInput): Promise<Loan | null> => {
    const { id, ...rest } = data;
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.put<{ success: true; data: Loan }>(`/loans/${id}`, rest);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al actualizar el préstamo.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateLoan, isLoading, error };
}

export function usePayInstallment(): UsePayInstallmentResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payInstallment = useCallback(
    async (
      loanId: string,
      installmentId: string,
      data: PayInstallmentInput
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);
        await apiClient.post(
          `/loans/${loanId}/installments/${installmentId}/pay`,
          data
        );
        return true;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al registrar el pago.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { payInstallment, isLoading, error };
}
