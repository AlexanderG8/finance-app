import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface BudgetRecommendation {
  categoryName: string;
  suggestedAmount: number;
  reasoning: string;
}

interface BudgetRecommendationsResult {
  recommendations: BudgetRecommendation[];
  noDataMessage?: string;
}

export function useAIBudgetRecommendations() {
  const [recommendations, setRecommendations] = useState<BudgetRecommendation[]>([]);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (): Promise<boolean> => {
    setIsGenerating(true);
    setRecommendations([]);
    setNoDataMessage(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: BudgetRecommendationsResult }>(
        '/ai/budget-recommendations',
        {},
      );
      if (res.data.success) {
        const { recommendations: recs, noDataMessage: msg } = res.data.data;
        setRecommendations(recs);
        setNoDataMessage(msg ?? null);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRecommendations([]);
    setNoDataMessage(null);
  }, []);

  return { recommendations, noDataMessage, isGenerating, generate, reset };
}
