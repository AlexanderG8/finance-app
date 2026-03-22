import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
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
