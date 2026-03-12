'use client';

import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Expense } from '@finance-app/shared';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta de crédito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
};

interface ExpenseCardProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg border border-[#E2E8F0] bg-white hover:shadow-sm transition-shadow">
        {/* Icono de categoría */}
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${expense.category.color}20` }}
        >
          <span>{expense.category.emoji}</span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[#1E293B] truncate">{expense.description}</p>
            <Badge
              variant="secondary"
              className="text-xs shrink-0"
              style={{
                backgroundColor: `${expense.category.color}20`,
                color: expense.category.color,
              }}
            >
              {expense.category.emoji} {expense.category.name}
            </Badge>
            {expense.isRecurring && (
              <Badge variant="outline" className="text-xs shrink-0 text-[#2E86AB] border-[#2E86AB]">
                Recurrente
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{formatDate(expense.date)}</span>
            <span>·</span>
            <span>{PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}</span>
            {expense.notes && (
              <>
                <span>·</span>
                <span className="truncate max-w-[120px]">{expense.notes}</span>
              </>
            )}
          </div>
        </div>

        {/* Monto */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-base font-semibold text-[#E63946]">
            -{formatCurrency(expense.amount, expense.currency)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-[#2E86AB]"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el gasto{' '}
              <span className="font-medium text-[#1E293B]">"{expense.description}"</span>? Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
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
