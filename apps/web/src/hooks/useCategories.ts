'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ExpenseCategory } from '@finance-app/shared';

interface UseCategoriesResult {
  categories: ExpenseCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ success: true; data: ExpenseCategory[] }>(
        '/categories'
      );
      setCategories(response.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { categories, isLoading, error, refetch };
}

export function useCreateCategory() {
  const [isLoading, setIsLoading] = useState(false);

  async function createCategory(data: {
    name: string;
    emoji: string;
    color: string;
  }): Promise<ExpenseCategory | null> {
    try {
      setIsLoading(true);
      const response = await apiClient.post<{ success: true; data: ExpenseCategory }>(
        '/categories',
        data
      );
      return response.data.data;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { createCategory, isLoading };
}

export function useUpdateCategory() {
  const [isLoading, setIsLoading] = useState(false);

  async function updateCategory(
    id: string,
    data: { name?: string; emoji?: string; color?: string }
  ): Promise<ExpenseCategory | null> {
    try {
      setIsLoading(true);
      const response = await apiClient.put<{ success: true; data: ExpenseCategory }>(
        `/categories/${id}`,
        data
      );
      return response.data.data;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { updateCategory, isLoading };
}

export function useDeleteCategory() {
  const [isLoading, setIsLoading] = useState(false);

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      setIsLoading(true);
      await apiClient.delete(`/categories/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { deleteCategory, isLoading };
}
