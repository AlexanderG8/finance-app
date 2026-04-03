import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Anomaly {
  categoryName: string;
  currentAmount: number;
  averageAmount: number;
  percentageIncrease: number;
  alertMessage: string;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

const CACHE_KEY = 'ai_anomalies_data_month';
const CACHE_MONTH_KEY = 'ai_anomalies_cache_month';

export function useAIAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  // On mount: restore cached result for this month (if any)
  useEffect(() => {
    async function restoreState() {
      try {
        const cacheMonth = await AsyncStorage.getItem(CACHE_MONTH_KEY);
        if (cacheMonth === getCurrentMonthKey()) {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Anomaly[];
            setAnomalies(parsed);
            setHasResult(true);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    restoreState();
  }, []);

  const detect = useCallback(async (): Promise<void> => {
    if (isLoading) return;

    setIsLoading(true);
    setHasResult(false);

    try {
      const res = await apiClient.post<{ success: boolean; data: { anomalies: Anomaly[] } }>(
        '/ai/anomalies',
        {},
      );
      if (res.data.success) {
        const found = res.data.data.anomalies;
        setAnomalies(found);
        setHasResult(true);

        const monthKey = getCurrentMonthKey();
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(found));
        await AsyncStorage.setItem(CACHE_MONTH_KEY, monthKey);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Dismiss clears cache and goes back to button (same as web)
  const dismiss = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_MONTH_KEY);
    } catch {
      // Ignore
    }
    setAnomalies([]);
    setHasResult(false);
  }, []);

  const showAlert = hasResult && anomalies.length > 0;
  const showEmpty = hasResult && anomalies.length === 0;

  return { anomalies, showAlert, showEmpty, isLoading, hasResult, detect, dismiss };
}
