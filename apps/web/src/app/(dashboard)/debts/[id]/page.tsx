'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebt } from '@/hooks/useDebts';
import { formatCurrency, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const DEBT_STATUS_CLASSES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
};

const DEBT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagada',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo',
};

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const debtId = params['id'] as string;

  const { debt, isLoading } = useDebt(debtId);

  const progressPercent =
    debt && debt.totalAmount > 0
      ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
      : 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <Navbar title="Detalle de deuda" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/debts')}
          className="gap-2 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a deudas
        </Button>

        {/* Debt summary card */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ) : debt ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#1E3A5F]">{debt.creditorName}</h2>
                  {debt.notes && (
                    <p className="text-sm text-slate-500 mt-1">{debt.notes}</p>
                  )}
                </div>
                <Badge className={DEBT_STATUS_CLASSES[debt.status]}>
                  {DEBT_STATUS_LABELS[debt.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total deuda</p>
                  <p className="text-lg font-bold text-[#1E3A5F]">
                    {formatCurrency(debt.totalAmount, debt.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Pagado</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(debt.paidAmount, debt.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Pendiente</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {formatCurrency(debt.totalAmount - debt.paidAmount, debt.currency)}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Progreso de pago</span>
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                {debt.dueDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Vence: {formatDate(debt.dueDate)}
                  </span>
                )}
                {debt.numberOfInstallments && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    {debt.numberOfInstallments} cuotas
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  {PAYMENT_METHOD_LABELS[debt.paymentMethod] ?? debt.paymentMethod}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Payment history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">
              Historial de pagos ({debt?.payments?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !debt?.payments || debt.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <DollarSign className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Sin pagos registrados</p>
                <p className="text-sm text-slate-400 mt-1">
                  Usa el botón "Pagar" en el listado de deudas para registrar un pago.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {debt.payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#1E293B]">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(payment.paidAt), "dd 'de' MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <Badge variant="secondary" className="text-xs">
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                        </Badge>
                        {payment.notes && (
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[160px] truncate">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
