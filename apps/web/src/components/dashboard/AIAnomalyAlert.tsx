'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';

interface Anomaly {
  categoryName: string;
  currentAmount: number;
  averageAmount: number;
  percentageIncrease: number;
  alertMessage: string;
}

function getDismissalKey(): string {
  const now = new Date();
  return `ai-anomalies-dismissed-${now.getFullYear()}-${now.getMonth() + 1}`;
}

export function AIAnomalyAlert() {
  const { accessToken } = useAuthStore();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed this month
    if (typeof window !== 'undefined') {
      const key = getDismissalKey();
      if (localStorage.getItem(key) === 'true') {
        setDismissed(true);
        return;
      }
    }

    if (!accessToken) return;

    // Fetch in background — don't block dashboard
    fetch('/api/ai/anomalies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((r) => r.json())
      .then((data: { anomalies?: Anomaly[] }) => {
        if (data.anomalies && data.anomalies.length > 0) {
          setAnomalies(data.anomalies);
        }
      })
      .catch(() => {
        // Silently ignore — anomaly detection is non-critical
      });
  }, [accessToken]);

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getDismissalKey(), 'true');
    }
    setDismissed(true);
  }

  if (dismissed || anomalies.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">
                    Gasto{anomalies.length > 1 ? 's' : ''} inusual{anomalies.length > 1 ? 'es' : ''} detectado{anomalies.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {anomalies.map((a) => (
                      <div key={a.categoryName}>
                        <p className="text-xs font-medium text-amber-700">
                          {a.categoryName} — S/ {a.currentAmount.toFixed(2)}{' '}
                          <span className="text-amber-600">
                            (+{a.percentageIncrease.toFixed(0)}% vs promedio S/ {a.averageAmount.toFixed(2)})
                          </span>
                        </p>
                        <p className="text-xs text-amber-600">{a.alertMessage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
                aria-label="Descartar alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
