import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Anomaly {
  categoryName: string;
  currentAmount: number;
  averageAmount: number;
  percentageIncrease: number;
  alertMessage: string;
}

const DISMISS_KEY = 'ai_anomalies_dismissed_month';

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

export function useAIAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const check = useCallback(async (): Promise<void> => {
    // Check if dismissed this month
    try {
      const stored = await AsyncStorage.getItem(DISMISS_KEY);
      if (stored === getCurrentMonthKey()) {
        setDismissed(true);
        setIsChecked(true);
        return;
      }
    } catch {
      // Ignore AsyncStorage errors
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: { anomalies: Anomaly[] } }>(
        '/ai/anomalies',
        {},
      );
      if (res.data.success) {
        setAnomalies(res.data.data.anomalies);
      }
    } catch {
      // Silently fail — anomaly check is non-critical
    } finally {
      setIsChecked(true);
    }
  }, []);

  const dismiss = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(DISMISS_KEY, getCurrentMonthKey());
    } catch {
      // Ignore
    }
    setDismissed(true);
    setAnomalies([]);
  }, []);

  const showAlert = isChecked && !dismissed && anomalies.length > 0;

  return { anomalies, showAlert, isChecked, check, dismiss };
}
