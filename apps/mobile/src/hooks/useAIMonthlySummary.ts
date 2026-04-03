import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface SummaryResult {
  summary: string;
}

export function useAIMonthlySummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (lang = 'es'): Promise<boolean> => {
    setIsGenerating(true);
    setSummary(null);
    try {
      const res = await apiClient.post<{ success: boolean; data: SummaryResult }>(
        '/ai/monthly-summary',
        { lang },
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
