import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE';

export interface Loan {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerContact: string | null;
  principal: number;
  currency: string;
  interestRate: number;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  deliveryMethod: string;
  loanDate: string;
  status: LoanStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  payments: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  installmentId: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface LoanDetail extends Loan {
  installments: LoanInstallment[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LoansFilters {
  status?: LoanStatus;
  borrowerName?: string;
  page?: number;
  limit?: number;
}

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async (filters: LoansFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.borrowerName) params.append('borrowerName', filters.borrowerName);
      params.append('page', String(filters.page ?? 1));
      params.append('limit', String(filters.limit ?? 20));

      const { data } = await apiClient.get(`/loans?${params.toString()}`);
      setLoans(data.data);
      setPagination(data.pagination);
    } catch {
      setError('No se pudieron cargar los préstamos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loans, pagination, isLoading, error, fetchLoans };
}

export function useLoanDetail() {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoan = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/loans/${id}`);
      setLoan(data.data);
    } catch {
      setError('No se pudo cargar el préstamo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loan, isLoading, error, fetchLoan, setLoan };
}

export function useLoanSummary() {
  const [summary, setSummary] = useState<{
    totalLent: number;
    totalCollected: number;
    totalPending: number;
    activeLoans: number;
    completedLoans: number;
    overdueLoans: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/loans/summary');
      setSummary(data.data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, fetchSummary };
}
