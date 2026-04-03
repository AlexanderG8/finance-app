import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  isUserCategory: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.get('/categories');
      setCategories(data.data);
    } catch {
      setError('No se pudieron cargar las categorías');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { categories, isLoading, error, fetchCategories };
}

export function useCategoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createCategory(input: {
    name: string;
    emoji: string;
    color: string;
  }): Promise<Category | null> {
    try {
      setIsSubmitting(true);
      const { data } = await apiClient.post('/categories', input);
      return data.data as Category;
    } catch {
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateCategory(
    id: string,
    input: { name?: string; emoji?: string; color?: string }
  ): Promise<Category | null> {
    try {
      setIsSubmitting(true);
      const { data } = await apiClient.put(`/categories/${id}`, input);
      return data.data as Category;
    } catch {
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      setIsSubmitting(true);
      await apiClient.delete(`/categories/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, createCategory, updateCategory, deleteCategory };
}
