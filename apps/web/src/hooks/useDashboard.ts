'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface DashboardSummary {
  currentMonth: { month: number; year: number };
  expenses: {
    total: number;
    byCategory: Array<{
      category: { id: string; name: string; emoji: string; color: string };
      total: number;
      count: number;
    }>;
  };
  income: {
    total: number;
    bySource: Array<{ source: string; total: number; count: number }>;
  };
  debtPayments: { total: number };
  balance: number;
  loans: {
    totalLent: number;
    totalCollected: number;
    totalPending: number;
    activeLoans: number;
    completedLoans: number;
    overdueLoans: number;
  };
  debts: { totalPending: number };
  savings: { totalSaved: number; goalsCount: number };
}

interface UpcomingInstallment {
  id: string;
  loanId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  loan: { borrowerName: string; currency: string };
}

interface UpcomingDebt {
  id: string;
  creditorName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  currency: string;
}

interface UpcomingPayments {
  loanInstallments: UpcomingInstallment[];
  debts: UpcomingDebt[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: DashboardSummary }>(
          '/dashboard/summary'
        );
        setData(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el dashboard.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return { data, isLoading, error };
}

export function useUpcomingPayments() {
  const [data, setData] = useState<UpcomingPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpcomingPayments() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: UpcomingPayments }>(
          '/dashboard/upcoming-payments'
        );
        setData(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar los vencimientos próximos.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUpcomingPayments();
  }, []);

  return { data, isLoading, error };
}

export type { UpcomingInstallment, UpcomingDebt, UpcomingPayments };
