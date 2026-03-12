'use client';

import { useState } from 'react';
import { Calendar, CreditCard, Trash2, Edit, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DebtStatusBadge } from './DebtStatusBadge';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { PersonalDebt } from '@finance-app/shared';

const paymentMethodLabels: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo',
};

interface DebtCardProps {
  debt: PersonalDebt;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DebtCard({ debt, onPay, onEdit, onDelete }: DebtCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progressPercent =
    debt.totalAmount > 0
      ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100)
      : 0;

  const isPastDue =
    debt.dueDate !== null && new Date(debt.dueDate) < new Date() && debt.status !== 'PAID';

  const remaining = debt.totalAmount - debt.paidAmount;

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-[#1E3A5F] text-white text-sm font-semibold">
                {getInitials(debt.creditorName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-[#1E293B] truncate">{debt.creditorName}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {paymentMethodLabels[debt.paymentMethod] ?? debt.paymentMethod}
              </p>
            </div>
          </div>
          <DebtStatusBadge status={debt.status} />
        </div>

        {/* Amounts */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Total</p>
            <p className="text-base font-bold text-[#1E3A5F]">
              {formatCurrency(debt.totalAmount, debt.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Pagado</p>
            <p className="text-base font-semibold text-green-600">
              {formatCurrency(debt.paidAmount, debt.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Pendiente</p>
            <p className="text-base font-semibold text-amber-600">
              {formatCurrency(remaining, debt.currency)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400">Progreso de pago</span>
            <span className="text-xs font-medium text-[#1E3A5F]">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {debt.dueDate && (
            <span
              className={`flex items-center gap-1 ${isPastDue ? 'text-red-600 font-medium' : ''}`}
            >
              <Calendar className="h-3 w-3" />
              Vence: {formatDate(debt.dueDate)}
              {isPastDue && ' (vencida)'}
            </span>
          )}
          {debt.numberOfInstallments && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {debt.numberOfInstallments} cuotas
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {confirmDelete ? (
            <>
              <span className="text-xs text-red-600 mr-1">¿Confirmar eliminación?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                className="text-xs"
              >
                Eliminar
              </Button>
            </>
          ) : (
            <>
              {debt.status !== 'PAID' && (
                <Button
                  size="sm"
                  onClick={onPay}
                  className="gap-1 bg-[#1E3A5F] hover:bg-[#2E86AB] text-xs"
                >
                  <DollarSign className="h-3 w-3" />
                  Pagar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-1 text-xs"
              >
                <Edit className="h-3 w-3" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
