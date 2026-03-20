'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth.store';

type Lang = 'es' | 'en';

interface AIMonthlySummaryProps {
  month: number;
  year: number;
}

export function AIMonthlySummary({ month, year }: AIMonthlySummaryProps) {
  const { accessToken } = useAuthStore();
  const [lang, setLang] = useState<Lang>('es');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (isLoading || !accessToken) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/ai/monthly-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ month, year, lang }),
      });

      if (!res.ok) throw new Error('Error al generar el resumen');
      const data = (await res.json()) as { summary: string };
      setSummary(data.summary);
    } catch {
      setError(lang === 'es' ? 'No se pudo generar el resumen. Intenta de nuevo.' : 'Failed to generate summary. Please try again.');
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
              <p className="text-sm font-semibold text-[#1E3A5F]">Resumen IA del mes</p>
              <p className="text-xs text-slate-500">Generado por Gemini · no se guarda</p>
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] p-0.5">
            <button
              onClick={() => { setLang('es'); setSummary(null); setError(null); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                lang === 'es'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-500 hover:text-[#1E3A5F]'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => { setLang('en'); setSummary(null); setError(null); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-500 hover:text-[#1E3A5F]'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </motion.div>
          ) : summary ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
              <button
                onClick={handleGenerate}
                className="mt-3 text-xs text-[#2E86AB] hover:underline"
              >
                {lang === 'es' ? 'Regenerar' : 'Regenerate'}
              </button>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleGenerate}
                className="mt-2 text-xs text-[#2E86AB] hover:underline"
              >
                {lang === 'es' ? 'Reintentar' : 'Retry'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-start gap-3"
            >
              <p className="text-sm text-slate-500">
                {lang === 'es'
                  ? 'Genera un análisis narrativo de tus finanzas de este mes con IA.'
                  : 'Generate an AI-powered narrative analysis of your finances this month.'}
              </p>
              <Button
                onClick={handleGenerate}
                size="sm"
                className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {lang === 'es' ? 'Generar resumen con IA' : 'Generate AI summary'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
