'use client';

import { useCreditCardCycle } from '@/hooks/useCreditCards';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CreditCardCycleSummaryProps {
  cardId: string;
}

export function CreditCardCycleSummary({ cardId }: CreditCardCycleSummaryProps) {
  const { summary, isLoading } = useCreditCardCycle(cardId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  if (!summary) return null;

  const { totalSpent, creditLimit, usagePercentage, cycleStart, cycleEnd, paymentDueDate, daysUntilPayment } = summary;

  const formatDate = (iso: string) =>
    format(new Date(iso), "d 'de' MMM", { locale: es });

  const urgencyColor =
    daysUntilPayment <= 5
      ? 'text-red-600'
      : daysUntilPayment <= 10
      ? 'text-amber-600'
      : 'text-green-600';

  const barColor =
    usagePercentage !== null && usagePercentage >= 90
      ? '#E63946'
      : usagePercentage !== null && usagePercentage >= 70
      ? '#F4A261'
      : '#28A745';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Ciclo: {formatDate(cycleStart)} → {formatDate(cycleEnd)}</span>
        <span className={`font-semibold ${urgencyColor}`}>
          {daysUntilPayment > 0
            ? `Pago en ${daysUntilPayment} días`
            : daysUntilPayment === 0
            ? 'Vence hoy'
            : 'Vencido'}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">Consumido en el ciclo</p>
          <p className="text-2xl font-bold text-[#1E3A5F]">{formatCurrency(totalSpent)}</p>
        </div>
        {creditLimit !== null && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Límite</p>
            <p className="text-sm font-semibold text-slate-600">{formatCurrency(creditLimit)}</p>
          </div>
        )}
      </div>

      {creditLimit !== null && usagePercentage !== null && (
        <div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: barColor,
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{usagePercentage}% del límite utilizado</p>
        </div>
      )}

      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
        Fecha límite de pago:{' '}
        <span className={`font-semibold ${urgencyColor}`}>
          {formatDate(paymentDueDate)}
        </span>
      </div>
    </div>
  );
}
