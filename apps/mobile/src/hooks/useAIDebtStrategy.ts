import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export interface DebtStrategy {
  recommendedMethod: 'avalanche' | 'snowball';
  methodExplanation: string;
  debtOrder: Array<{ creditorName: string; reason: string }>;
  monthlyTargetAmount: number;
  estimatedMonthsToDebtFree: number;
}

export function useAIDebtStrategy() {
  const [strategy, setStrategy] = useState<DebtStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (): Promise<boolean> => {
    setIsGenerating(true);
    setStrategy(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: DebtStrategy }>(
        '/ai/debt-strategy',
        {},
      );
      if (res.data.success) {
        setStrategy(res.data.data);
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
    setStrategy(null);
  }, []);

  return { strategy, isGenerating, generate, reset };
}
