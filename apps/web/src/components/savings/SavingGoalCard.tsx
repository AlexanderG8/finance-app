'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Calendar, TrendingUp, Trash2, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { SavingGoalStatusBadge, SavingGoalTypeBadge } from './SavingGoalStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SavingGoal } from '@finance-app/shared';

interface SavingGoalCardProps {
  goal: SavingGoal;
  onContribute: () => void;
  onDelete: () => void;
}

export function SavingGoalCard({ goal, onContribute, onDelete }: SavingGoalCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  function progressBarColor() {
    if (goal.status === 'COMPLETED') return 'bg-green-500';
    if (goal.status === 'PAUSED') return 'bg-slate-400';
    return 'bg-[#2E86AB]';
  }

  return (
    <>
    <Card className="hover:shadow-md transition-shadow duration-200 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
              <PiggyBank className="h-4 w-4 text-[#1E3A5F]" />
            </div>
            <p className="font-semibold text-[#1E293B] truncate">{goal.name}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <SavingGoalTypeBadge type={goal.type} />
            <SavingGoalStatusBadge status={goal.status} />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-[#1E3A5F]">
              {formatCurrency(goal.currentAmount, goal.currency)}
            </span>
            <span className="text-xs text-slate-400">
              {progressPercent.toFixed(0)}% de {formatCurrency(goal.targetAmount, goal.currency)}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${progressBarColor()}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4 flex-1">
          {goal.targetDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Meta: {formatDate(goal.targetDate)}
            </span>
          )}
          {goal.monthlyContribution && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatCurrency(goal.monthlyContribution, goal.currency)}/mes
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {goal.status !== 'COMPLETED' && (
              <Button
                size="sm"
                onClick={onContribute}
                className="gap-1 bg-[#1E3A5F] hover:bg-[#2E86AB] text-xs"
              >
                <TrendingUp className="h-3 w-3" />
                Aportar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/savings/${goal.id}`)}
            className="gap-1 text-[#2E86AB] hover:text-[#1E3A5F] hover:bg-[#2E86AB]/10 text-xs"
          >
            Ver detalle
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Eliminar meta de ahorro</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar la meta{' '}
            <span className="font-medium text-[#1E293B]">"{goal.name}"</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => { setShowDeleteDialog(false); onDelete(); }}
            className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
