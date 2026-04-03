'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CreditCard, CreditCardCycleSummary } from '@finance-app/shared';

interface UseCreditCardsResult {
  cards: CreditCard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCreditCardCycleResult {
  summary: CreditCardCycleSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

type CreateCreditCardInput = {
  entityName: string;
  cycleStartDay: number;
  paymentDueDay: number;
  currency: 'PEN' | 'USD';
  creditLimit?: number;
  notes?: string;
};

type UpdateCreditCardInput = Partial<CreateCreditCardInput>;

interface UseCreateCreditCardResult {
  createCreditCard: (data: CreateCreditCardInput) => Promise<CreditCard | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseUpdateCreditCardResult {
  updateCreditCard: (id: string, data: UpdateCreditCardInput) => Promise<CreditCard | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseDeleteCreditCardResult {
  deleteCreditCard: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useCreditCards(): UseCreditCardsResult {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchCards() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: CreditCard[] }>('/credit-cards');
        setCards(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar las tarjetas.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCards();
  }, [tick]);

  return { cards, isLoading, error, refetch };
}

export function useCreditCardCycle(cardId: string): UseCreditCardCycleResult {
  const [summary, setSummary] = useState<CreditCardCycleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!cardId) return;
    async function fetchCycle() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get<{ success: true; data: CreditCardCycleSummary }>(
          `/credit-cards/${cardId}/cycle`
        );
        setSummary(response.data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error ?? 'Error al cargar el ciclo.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCycle();
  }, [cardId, tick]);

  return { summary, isLoading, error, refetch };
}

export function useCreateCreditCard(): UseCreateCreditCardResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCreditCard = useCallback(async (data: CreateCreditCardInput): Promise<CreditCard | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post<{ success: true; data: CreditCard }>('/credit-cards', data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear la tarjeta.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createCreditCard, isLoading, error };
}

export function useUpdateCreditCard(): UseUpdateCreditCardResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCreditCard = useCallback(async (id: string, data: UpdateCreditCardInput): Promise<CreditCard | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.put<{ success: true; data: CreditCard }>(`/credit-cards/${id}`, data);
      return response.data.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al actualizar la tarjeta.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateCreditCard, isLoading, error };
}

export function useDeleteCreditCard(): UseDeleteCreditCardResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCreditCard = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/credit-cards/${id}`);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al eliminar la tarjeta.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteCreditCard, isLoading, error };
}
