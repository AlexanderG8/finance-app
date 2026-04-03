'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Search, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

interface Anomaly {
  categoryName: string;
  currentAmount: number;
  averageAmount: number;
  percentageIncrease: number;
  alertMessage: string;
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

function getCacheKey(): string {
  return `ai-anomalies-data-${getMonthKey()}`;
}

type ViewState = 'idle' | 'loading' | 'anomalies' | 'no_anomalies';

export function AIAnomalyAlert() {
  const { accessToken } = useAuthStore();
  const [state, setState] = useState<ViewState>('idle');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // On mount: restore cached result from this month (if any and not dismissed)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cached = localStorage.getItem(getCacheKey());
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Anomaly[];
        setAnomalies(parsed);
        setState(parsed.length > 0 ? 'anomalies' : 'no_anomalies');
      } catch {
        // ignore corrupt cache — start from idle
      }
    }
  }, []);

  async function handleDetect() {
    if (!accessToken || state === 'loading') return;
    setState('loading');

    try {
      const res = await fetch('/api/ai/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await res.json()) as { anomalies?: Anomaly[] };
      const found = data.anomalies ?? [];

      setAnomalies(found);
      setState(found.length > 0 ? 'anomalies' : 'no_anomalies');

      if (typeof window !== 'undefined') {
        localStorage.setItem(getCacheKey(), JSON.stringify(found));
      }
    } catch {
      setState('idle');
    }
  }

  // Dismiss clears the cached result and goes back to idle (button visible again)
  function handleDismiss() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getCacheKey());
    }
    setAnomalies([]);
    setState('idle');
  }

  return (
    <AnimatePresence mode="wait">
      {state === 'idle' && (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
                  <Search className="h-4 w-4 text-[#1E3A5F]" />
                </div>
                <p className="text-sm text-slate-600 truncate">
                  Detecta gastos inusuales comparados con tus últimos 2 meses
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleDetect}
                className="shrink-0 bg-[#1E3A5F] hover:bg-[#2E86AB] gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Detectar anomalías
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {state === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-[#1E3A5F] border-t-transparent animate-spin shrink-0" />
              <p className="text-sm text-slate-500">Analizando gastos inusuales...</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {state === 'no_anomalies' && (
        <motion.div
          key="no_anomalies"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-400">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Sin anomalías detectadas</p>
                  <p className="text-xs text-green-600">Tus gastos están dentro del rango habitual</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-green-400 hover:text-green-600 transition-colors"
                aria-label="Descartar"
              >
                <X className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {state === 'anomalies' && (
        <motion.div
          key="anomalies"
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
      )}
    </AnimatePresence>
  );
}
