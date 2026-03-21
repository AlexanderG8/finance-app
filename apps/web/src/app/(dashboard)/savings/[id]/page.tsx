'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight,
  Calendar,
  TrendingUp,
  Edit,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SavingGoalStatusBadge, SavingGoalTypeBadge } from '@/components/savings/SavingGoalStatusBadge';
import { ProjectionCard } from '@/components/savings/ProjectionCard';
import { ContributionHistory } from '@/components/savings/ContributionHistory';
import { SavingGoalFormModal } from '@/components/savings/SavingGoalFormModal';
import { ContributeModal } from '@/components/savings/ContributeModal';
import { AISavingsAdvice } from '@/components/savings/AISavingsAdvice';
import { useSavingGoal, useSavingGoalProjection } from '@/hooks/useSavings';
import { formatCurrency, formatDate } from '@/lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

interface SavingGoalDetailPageProps {
  params: { id: string };
}

export default function SavingGoalDetailPage({ params }: SavingGoalDetailPageProps) {
  const { goal, isLoading, error, refetch } = useSavingGoal(params.id);
  const { projection, isLoading: projectionLoading } = useSavingGoalProjection(params.id);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);

  const progressPercent =
    goal && goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  function progressBarColor() {
    if (!goal) return 'bg-[#2E86AB]';
    if (goal.status === 'COMPLETED') return 'bg-green-500';
    if (goal.status === 'PAUSED') return 'bg-slate-400';
    return 'bg-[#2E86AB]';
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.3 }}
    >
      <Navbar title={goal?.name ?? 'Meta de ahorro'} />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/savings" className="hover:text-[#2E86AB] transition-colors">
            Ahorros
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#1E293B] font-medium">
            {isLoading ? 'Cargando...' : (goal?.name ?? 'Detalle')}
          </span>
        </div>

        {/* Error state */}
        {error && (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 rounded" />
                  <Skeleton className="h-16 rounded" />
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-32 w-full rounded-lg" />
          </>
        )}

        {goal && !isLoading && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#1E3A5F]">{goal.name}</h1>
                <SavingGoalStatusBadge status={goal.status} />
                <SavingGoalTypeBadge type={goal.type} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="gap-1 shrink-0"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </div>

            {/* Main content — 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Left: Progress card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progreso de la meta
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Big progress bar */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-2xl font-bold text-[#1E3A5F]">
                          {formatCurrency(goal.currentAmount, goal.currency)}
                        </p>
                        <p className="text-xs text-slate-400">ahorrado</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-600">
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </p>
                        <p className="text-xs text-slate-400">objetivo</p>
                      </div>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all ${progressBarColor()}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-slate-400">0%</span>
                      <span className="text-xs font-semibold text-[#1E3A5F]">
                        {progressPercent.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-400">100%</span>
                    </div>
                  </div>

                  {/* Detail stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Restante</p>
                      <p className="text-base font-semibold text-amber-600">
                        {formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)}
                      </p>
                    </div>
                    {goal.monthlyContribution && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">Contribución mensual</p>
                        <p className="text-base font-semibold text-[#1E293B]">
                          {formatCurrency(goal.monthlyContribution, goal.currency)}
                        </p>
                      </div>
                    )}
                    {goal.targetDate && (
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha objetivo
                        </p>
                        <p className="text-base font-semibold text-[#1E293B]">
                          {formatDate(goal.targetDate, 'long')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Aportes realizados</p>
                      <p className="text-base font-semibold text-[#1E293B]">
                        {goal.contributions?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  {goal.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 mb-0.5">Notas</p>
                      <p className="text-sm text-slate-600">{goal.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Projection card */}
              {projectionLoading ? (
                <Skeleton className="h-48 rounded-lg" />
              ) : projection ? (
                <ProjectionCard projection={projection} currency={goal.currency} />
              ) : null}
            </div>

            {/* AI Savings Advice */}
            <AISavingsAdvice goalId={params.id} />

            {/* Contribution history */}
            <ContributionHistory
              contributions={goal.contributions ?? []}
              currency={goal.currency}
            />

            {/* Contribute button */}
            {goal.status !== 'COMPLETED' && (
              <div className="flex justify-center pb-4">
                <Button
                  onClick={() => setContributeModalOpen(true)}
                  className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB] shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  Registrar aporte
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {goal && (
        <>
          <SavingGoalFormModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            goal={goal}
            onSuccess={() => {
              refetch();
              setEditModalOpen(false);
            }}
          />
          <ContributeModal
            open={contributeModalOpen}
            onClose={() => setContributeModalOpen(false)}
            goal={goal}
            onSuccess={() => {
              refetch();
              setContributeModalOpen(false);
            }}
          />
        </>
      )}
    </motion.div>
  );
}
