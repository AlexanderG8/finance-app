'use client';

import { useState } from 'react';
import { Sparkles, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

interface Recommendation {
  categoryName: string;
  suggestedAmount: number;
  reasoning: string;
}

interface AIBudgetRecommendationsProps {
  onApply: (categoryName: string, amount: number) => void;
}

export function AIBudgetRecommendationsButton({ onApply }: AIBudgetRecommendationsProps) {
  const { accessToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  async function handleOpen() {
    setOpen(true);
    if (recommendations.length > 0) return;
    await fetchRecommendations();
  }

  async function fetchRecommendations() {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/budget-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Error al obtener recomendaciones');
      const data = (await res.json()) as { recommendations: Recommendation[] };
      setRecommendations(data.recommendations);
    } catch {
      setError('No se pudieron obtener las recomendaciones. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleApply(rec: Recommendation) {
    onApply(rec.categoryName, rec.suggestedAmount);
    setApplied((prev) => new Set(prev).add(rec.categoryName));
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2 border-[#2E86AB] text-[#2E86AB] hover:bg-[#2E86AB] hover:text-white"
      >
        <Sparkles className="h-4 w-4" />
        Sugerir con IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <Sparkles className="h-4 w-4 text-[#2E86AB]" />
              Recomendaciones de presupuesto IA
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 -mt-2">
            Basado en tus gastos de los últimos 3 meses. Acepta cada sugerencia individualmente.
          </p>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 mt-2"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2"
              >
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={fetchRecommendations}
                >
                  Reintentar
                </Button>
              </motion.div>
            ) : recommendations.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 text-center text-sm text-slate-500"
              >
                No hay datos suficientes de los últimos 3 meses para generar recomendaciones.
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 mt-2"
              >
                {recommendations.map((rec) => {
                  const isApplied = applied.has(rec.categoryName);
                  return (
                    <div
                      key={rec.categoryName}
                      className="rounded-lg border border-[#E2E8F0] bg-white p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-[#1E3A5F]">
                          {rec.categoryName}
                        </p>
                        <p className="text-sm font-bold text-[#1E293B]">
                          S/ {rec.suggestedAmount.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{rec.reasoning}</p>
                      <Button
                        size="sm"
                        variant={isApplied ? 'outline' : 'default'}
                        className={
                          isApplied
                            ? 'gap-1.5 text-[#28A745] border-[#28A745] cursor-default'
                            : 'gap-1.5 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white'
                        }
                        onClick={() => !isApplied && handleApply(rec)}
                        disabled={isApplied}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aplicado
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aplicar sugerencia
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-1.5" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
