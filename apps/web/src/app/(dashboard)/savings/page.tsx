'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, PiggyBank, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SavingGoalCard } from '@/components/savings/SavingGoalCard';
import { SavingGoalFormModal } from '@/components/savings/SavingGoalFormModal';
import { ContributeModal } from '@/components/savings/ContributeModal';
import { useSavingGoals, useDeleteSavingGoal } from '@/hooks/useSavings';
import { formatCurrency } from '@/lib/utils';
import type { SavingGoal } from '@finance-app/shared';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

export default function SavingsPage() {
  const { goals, isLoading, error, refetch } = useSavingGoals();
  const { deleteGoal } = useDeleteSavingGoal();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | undefined>(undefined);
  const [contributingGoal, setContributingGoal] = useState<SavingGoal | undefined>(undefined);

  // Stats
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const activeCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;
  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length;

  function handleOpenCreate() {
    setEditingGoal(undefined);
    setFormModalOpen(true);
  }

  function handleSuccess() {
    refetch();
  }

  async function handleDelete(id: string) {
    const ok = await deleteGoal(id);
    if (ok) refetch();
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Ahorros" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Gestiona tus metas de ahorro</p>
          <Button
            onClick={handleOpenCreate}
            className="gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB]"
          >
            <Plus className="h-4 w-4" />
            Nueva meta
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Total ahorrado</p>
              <p className="text-xl font-bold text-[#1E3A5F]">
                {formatCurrency(totalSaved)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{goals.length} meta(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Metas activas</p>
              <p className="text-xl font-bold text-[#2E86AB]">{activeCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">En progreso</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">Metas completadas</p>
              <p className="text-xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">Objetivos logrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Error state */}
        {error && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-40 flex-1" />
                  </div>
                  <Skeleton className="h-2 w-full rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Goals grid */}
        {!isLoading && !error && goals.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {goals.map((goal) => (
              <motion.div key={goal.id} variants={cardVariants}>
                <SavingGoalCard
                  goal={goal}
                  onContribute={() => setContributingGoal(goal)}
                  onDelete={() => handleDelete(goal.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !error && goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PiggyBank className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-500">No hay metas de ahorro</p>
              <p className="text-sm text-slate-400 mt-1">
                Crea tu primera meta de ahorro para comenzar
              </p>
              <Button
                className="mt-4 gap-2 bg-[#1E3A5F] hover:bg-[#2E86AB]"
                onClick={handleOpenCreate}
              >
                <Plus className="h-4 w-4" />
                Nueva meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <SavingGoalFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        goal={editingGoal}
        onSuccess={handleSuccess}
      />

      {contributingGoal && (
        <ContributeModal
          open={Boolean(contributingGoal)}
          onClose={() => setContributingGoal(undefined)}
          goal={contributingGoal}
          onSuccess={handleSuccess}
        />
      )}
    </motion.div>
  );
}
