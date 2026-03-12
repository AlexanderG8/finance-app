'use client';

import { cn } from '@/lib/utils';
import type { DebtStatus } from '@finance-app/shared';

interface DebtStatusBadgeProps {
  status: DebtStatus;
  className?: string;
}

const statusConfig: Record<DebtStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-slate-100 text-slate-700',
  },
  PARTIAL: {
    label: 'Parcial',
    className: 'bg-amber-100 text-amber-700',
  },
  PAID: {
    label: 'Pagado',
    className: 'bg-green-100 text-green-700',
  },
};

export function DebtStatusBadge({ status, className }: DebtStatusBadgeProps) {
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
