import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface SavingsAdvice {
  isAchievable: boolean;
  assessment: string;
  recommendedMonthlyContribution: number;
  estimatedCompletionDate: string;
  tips: string[];
}

export function useAISavingsAdvice() {
  const [advice, setAdvice] = useState<SavingsAdvice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (goalId: string): Promise<boolean> => {
    setIsGenerating(true);
    setAdvice(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: SavingsAdvice }>(
        '/ai/savings-advice',
        { goalId },
      );
      if (res.data.success) {
        setAdvice(res.data.data);
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
    setAdvice(null);
  }, []);

  return { advice, isGenerating, generate, reset };
}
