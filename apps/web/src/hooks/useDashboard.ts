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
