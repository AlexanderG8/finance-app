'use client';

import { cn } from '@/lib/utils';
import type { SavingGoalStatus, SavingGoalType } from '@finance-app/shared';

interface SavingGoalStatusBadgeProps {
  status: SavingGoalStatus;
  className?: string;
}

interface SavingGoalTypeBadgeProps {
  type: SavingGoalType;
  className?: string;
}

const statusConfig: Record<SavingGoalStatus, { label: string; className: string }> = {
  IN_PROGRESS: {
    label: 'En progreso',
    className: 'bg-blue-100 text-blue-700',
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-green-100 text-green-700',
  },
  PAUSED: {
    label: 'Pausado',
    className: 'bg-slate-100 text-slate-600',
  },
};

const typeConfig: Record<SavingGoalType, { label: string; className: string }> = {
  OBJECTIVE: {
    label: 'Objetivo',
    className: 'bg-violet-100 text-violet-700',
  },
  EMERGENCY: {
    label: 'Emergencia',
    className: 'bg-orange-100 text-orange-700',
  },
  CUSTOM: {
    label: 'Personalizado',
    className: 'bg-teal-100 text-teal-700',
  },
};

export function SavingGoalStatusBadge({ status, className }: SavingGoalStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function SavingGoalTypeBadge({ type, className }: SavingGoalTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
