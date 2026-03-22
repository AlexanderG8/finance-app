import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface MonthlySummaryResult {
  summary: string;
}

export function useAIMonthlySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (month?: number, year?: number, lang = 'es'): Promise<boolean> => {
    setIsGenerating(true);
    setSummary(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: MonthlySummaryResult }>(
        '/ai/monthly-summary',
        { month, year, lang },
      );
      if (res.data.success) {
        setSummary(res.data.data.summary);
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
    setSummary(null);
  }, []);

  return { summary, isGenerating, generate, reset };
}
