'use client';

import { useState } from 'react';
import { Brain, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

interface DebtOrder {
  creditorName: string;
  reason: string;
}

interface DebtStrategyResult {
  recommendedMethod: 'avalanche' | 'snowball';
  methodExplanation: string;
  debtOrder: DebtOrder[];
  monthlyTargetAmount: number;
  estimatedMonthsToDebtFree: number;
}

const METHOD_LABELS: Record<string, string> = {
  avalanche: 'Método Avalancha',
  snowball: 'Método Bola de Nieve',
};

export function AIDebtStrategy() {
  const { accessToken } = useAuthStore();
  const [result, setResult] = useState<DebtStrategyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleAnalyze() {
    if (isLoading || !accessToken) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setExpanded(true);

    try {
      const res = await fetch('/api/ai/debt-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 400) {
        setError('No tienes deudas pendientes para analizar.');
        return;
      }
      if (!res.ok) throw new Error('Error al analizar deudas');

      const data = (await res.json()) as DebtStrategyResult;
      setResult(data);
    } catch {
      setError('No se pudo obtener la estrategia. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F]">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E3A5F]">Estrategia de pago IA</p>
              <p className="text-xs text-slate-500">Avalancha vs Bola de nieve</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {result && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-400 hover:text-slate-600"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {result ? 'Reanalizar' : 'Analizar mis deudas'}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {(isLoading || result || error) && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : error ? (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
                ) : result ? (
                  <>
                    {/* Method badge + explanation */}
                    <div>
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1E3A5F] text-white mb-2">
                        {METHOD_LABELS[result.recommendedMethod]}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {result.methodExplanation}
                      </p>
                    </div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Meta mensual</p>
                        <p className="text-base font-bold text-[#1E3A5F]">
                          S/ {result.monthlyTargetAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Libre de deudas en</p>
                        <p className="text-base font-bold text-[#28A745]">
                          {result.estimatedMonthsToDebtFree} mes(es)
                        </p>
                      </div>
                    </div>

                    {/* Debt order */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Orden de pago recomendado
                      </p>
                      <div className="space-y-2">
                        {result.debtOrder.map((d, i) => (
                          <div key={d.creditorName} className="flex items-start gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E86AB] text-white text-xs font-bold mt-0.5">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#1E293B]">{d.creditorName}</p>
                              <p className="text-xs text-slate-500">{d.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
