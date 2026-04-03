'use client';

import { differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { UpcomingInstallment, UpcomingDebt } from '@/hooks/useDashboard';

interface UpcomingPaymentsProps {
  loanInstallments: UpcomingInstallment[];
  debts: UpcomingDebt[];
  isLoading: boolean;
}

function getDaysLabel(dueDate: string): { label: string; variant: 'destructive' | 'warning' | 'secondary' } {
  const days = differenceInDays(parseISO(dueDate), new Date());

  if (days < 0) {
    return { label: `Vencido hace ${Math.abs(days)}d`, variant: 'destructive' };
  }
  if (days === 0) {
    return { label: 'Vence hoy', variant: 'destructive' };
  }
  if (days <= 2) {
    return { label: `${days}d restante(s)`, variant: 'warning' };
  }
  return { label: `${days}d restante(s)`, variant: 'secondary' };
}

function badgeClass(variant: 'destructive' | 'warning' | 'secondary'): string {
  if (variant === 'destructive') return 'bg-red-100 text-red-700 border-red-200';
  if (variant === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function UpcomingPaymentsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UpcomingPayments({ loanInstallments, debts, isLoading }: UpcomingPaymentsProps) {
  if (isLoading) return <UpcomingPaymentsSkeleton />;

  const hasItems = loanInstallments.length > 0 || debts.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base text-[#1E3A5F]">Vencimientos próximos (7 días)</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-10 w-10 text-[#28A745] mb-3" />
            <p className="text-sm font-medium text-[#28A745]">No hay vencimientos próximos</p>
            <p className="text-xs text-slate-400 mt-1">Estás al día con tus pagos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cuotas de préstamos */}
            {loanInstallments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Cuotas de préstamos
                </p>
                {loanInstallments.map((installment) => {
                  const { label, variant } = getDaysLabel(installment.dueDate);
                  const remaining = Number(installment.amount) - Number(installment.paidAmount);
                  return (
                    <div
                      key={installment.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <Users className="h-4 w-4 text-[#2E86AB]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1E293B] leading-tight">
                            {installment.loan.borrowerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Cuota #{installment.number} · {formatDate(installment.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold text-[#2E86AB]">
                          {formatCurrency(remaining, installment.loan.currency as 'PEN' | 'USD')}
                        </p>
                        <Badge className={`text-[10px] px-1.5 py-0.5 border ${badgeClass(variant)}`}>
                          {label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Deudas próximas */}
            {debts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Deudas próximas
                </p>
                {debts.map((debt) => {
                  const { label, variant } = getDaysLabel(debt.dueDate);
                  const remaining = Number(debt.totalAmount) - Number(debt.paidAmount);
                  return (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                          <CreditCard className="h-4 w-4 text-[#F4A261]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1E293B] leading-tight">
                            {debt.creditorName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Deuda pendiente · {formatDate(debt.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold text-[#F4A261]">
                          {formatCurrency(remaining, debt.currency as 'PEN' | 'USD')}
                        </p>
                        <Badge className={`text-[10px] px-1.5 py-0.5 border ${badgeClass(variant)}`}>
                          {label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {loanInstallments.length + debts.length > 4 && (
              <div className="flex items-center gap-1.5 pt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-amber-600">
                  Tienes {loanInstallments.length + debts.length} vencimientos esta semana.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
