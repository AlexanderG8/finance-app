'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SavingGoal, SavingGoalProjection, SavingGoalType, SavingGoalStatus } from '@finance-app/shared';

interface UseSavingGoalsResult {
  goals: SavingGoal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseSavingGoalResult {
  goal: SavingGoal | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseSavingGoalProjectionResult {
  projection: SavingGoalProjection | null;
  isLoading: boolean;
  error: string | null;
}

type CreateSavingGoalInput = {
  name: string;
  type: SavingGoalType;
  targetAmount: number;
  currency: 'PEN' | 'USD';
  targetDate?: string;
  monthlyContribution?: number;
  notes?: string;
};

type UpdateSavingGoalInput = Partial<CreateSavingGoalInput> & {
  status?: SavingGoalStatus;
};

type ContributeInput = {
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  contributedAt: string;
  notes?: string;
};

interface UseCreateSavingGoalResult {
  createGoal: (data: CreateSavingGoalInput) => Promise<SavingGoal | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseUpdateSavingGoalResult {
  updateGoal: (id: string, data: UpdateSavingGoalInput) => Promise<SavingGoal | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseContributeResult {
  contribute: (id: string, data: ContributeInput) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

interface UseDeleteSavingGoalResult {
  deleteGoal: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useSavingGoals(): UseSavingGoalsResult {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchGoals() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: SavingGoal[] }>('/savings');
        setGoals(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar las metas de ahorro.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchGoals();
  }, [tick]);

  return { goals, isLoading, error, refetch };
}

export function useSavingGoal(id: string): UseSavingGoalResult {
  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;

    async function fetchGoal() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: SavingGoal }>(
          `/savings/${id}`
        );
        setGoal(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar la meta de ahorro.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchGoal();
  }, [id, tick]);

  return { goal, isLoading, error, refetch };
}

export function useSavingGoalProjection(id: string): UseSavingGoalProjectionResult {
  const [projection, setProjection] = useState<SavingGoalProjection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProjection() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: SavingGoalProjection }>(
          `/savings/${id}/projection`
        );
        setProjection(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar la proyección.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjection();
  }, [id]);

  return { projection, isLoading, error };
}

export function useCreateSavingGoal(): UseCreateSavingGoalResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCallback(
    async (data: CreateSavingGoalInput): Promise<SavingGoal | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.post<{ success: true; data: SavingGoal }>(
          '/savings',
          data
        );
        return response.data.data;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al crear la meta de ahorro.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createGoal, isLoading, error };
}

export function useUpdateSavingGoal(): UseUpdateSavingGoalResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateGoal = useCallback(
    async (id: string, data: UpdateSavingGoalInput): Promise<SavingGoal | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.put<{ success: true; data: SavingGoal }>(
          `/savings/${id}`,
          data
        );
        return response.data.data;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al actualizar la meta de ahorro.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { updateGoal, isLoading, error };
}

export function useContribute(): UseContributeResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contribute = useCallback(async (id: string, data: ContributeInput): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.post(`/savings/${id}/contribute`, data);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al registrar el aporte.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { contribute, isLoading, error };
}

export function useDeleteSavingGoal(): UseDeleteSavingGoalResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/savings/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar la meta de ahorro.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteGoal, isLoading, error };
}
