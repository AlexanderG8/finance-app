'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';

interface SavingsAdviceResult {
  isAchievable: boolean;
  assessment: string;
  recommendedMonthlyContribution: number;
  estimatedCompletionDate: string;
  tips: string[];
}

interface AISavingsAdviceProps {
  goalId: string;
}

export function AISavingsAdvice({ goalId }: AISavingsAdviceProps) {
  const { accessToken } = useAuthStore();
  const [result, setResult] = useState<SavingsAdviceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (isLoading || !accessToken) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/savings-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ goalId }),
      });

      if (!res.ok) throw new Error('Error al analizar la meta');
      const data = (await res.json()) as SavingsAdviceResult;
      setResult(data);
    } catch {
      setError('No se pudo analizar la meta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E3A5F]">Asesor IA de ahorro</p>
              <p className="text-xs text-slate-500">Basado en tu balance mensual real</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {result ? 'Reanalizar' : 'Analizar con IA'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Viability badge + assessment */}
              <div className="flex items-start gap-2">
                {result.isAchievable ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-slate-700 leading-relaxed">{result.assessment}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Aporte mensual sugerido</p>
                  <p className="text-base font-bold text-[#1E3A5F]">
                    S/ {result.recommendedMonthlyContribution.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Fecha estimada</p>
                  <p className="text-base font-bold text-[#28A745]">
                    {formatDate(result.estimatedCompletionDate, 'short')}
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Tips para llegar más rápido
                </p>
                <div className="space-y-2">
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2E86AB] text-white text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-slate-500">
                Analiza la viabilidad de esta meta según tu balance mensual real de los últimos 3 meses.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
