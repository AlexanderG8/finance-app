import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface CreditCard {
  id: string;
  userId: string;
  entityName: string;
  cycleStartDay: number;
  paymentDueDay: number;
  currency: string;
  creditLimit: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardCycleSummary {
  card: CreditCard;
  cycleStart: string;
  cycleEnd: string;
  paymentDueDate: string;
  daysUntilPayment: number;
  totalSpent: number;
  creditLimit: number | null;
  usagePercentage: number | null;
}

interface CreditCardPayload {
  entityName: string;
  cycleStartDay: number;
  paymentDueDay: number;
  currency: string;
  creditLimit?: number;
  notes?: string;
}

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get('/credit-cards');
      setCards(data.data as CreditCard[]);
    } catch {
      setError('No se pudieron cargar las tarjetas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCard = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/credit-cards/${id}`);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { cards, isLoading, error, fetchCards, deleteCard };
}

export function useCreditCardForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCard = useCallback(async (payload: CreditCardPayload): Promise<CreditCard | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.post('/credit-cards', payload);
      return data.data as CreditCard;
    } catch {
      setError('No se pudo crear la tarjeta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateCard = useCallback(async (id: string, payload: Partial<CreditCardPayload>): Promise<CreditCard | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const { data } = await apiClient.put(`/credit-cards/${id}`, payload);
      return data.data as CreditCard;
    } catch {
      setError('No se pudo actualizar la tarjeta');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, createCard, updateCard };
}

export function useCreditCardCycle() {
  const [summary, setSummary] = useState<CreditCardCycleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCycle = useCallback(async (cardId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get(`/credit-cards/${cardId}/cycle`);
      setSummary(data.data as CreditCardCycleSummary);
    } catch {
      setError('No se pudo cargar el ciclo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { summary, isLoading, error, fetchCycle };
}
