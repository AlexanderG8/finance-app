'use client';

import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency } from '@/lib/utils';
import type { BudgetComparison } from '@finance-app/shared';

interface BudgetProgressProps {
  comparison: BudgetComparison;
  onDelete?: () => void;
}

export function BudgetProgress({ comparison }: BudgetProgressProps) {
  const { budget, spent, remaining, percentage } = comparison;

  const clampedPercentage = Math.min(percentage, 100);

  const colorClass =
    percentage >= 100
      ? 'text-red-600'
      : percentage >= 80
      ? 'text-amber-500'
      : 'text-green-600';

  const progressColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 80
      ? 'bg-amber-400'
      : 'bg-green-500';

  const statusLabel =
    percentage >= 100
      ? 'Excedido'
      : percentage >= 80
      ? 'Cerca del límite'
      : 'En control';

  const statusBg =
    percentage >= 100
      ? 'bg-red-50 text-red-600 border-red-200'
      : percentage >= 80
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-green-50 text-green-600 border-green-200';

  return (
    <div className="p-4 rounded-lg border border-[#E2E8F0] bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: `${budget.category.color}20` }}
          >
            <span>{budget.category.emoji}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1E293B]">{budget.category.name}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(spent, budget.currency)} de{' '}
              {formatCurrency(budget.amount, budget.currency)}
            </p>
          </div>
        </div>
        <div className="text-right flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full border',
              statusBg
            )}
          >
            {statusLabel}
          </span>
          <span className={cn('text-sm font-bold', colorClass)}>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all', progressColor)}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Gastado: {formatCurrency(spent, budget.currency)}</span>
          {remaining >= 0 ? (
            <span className="text-green-600">
              Restante: {formatCurrency(remaining, budget.currency)}
            </span>
          ) : (
            <span className="text-red-600">
              Exceso: {formatCurrency(Math.abs(remaining), budget.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
