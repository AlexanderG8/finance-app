'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePayDebt } from '@/hooks/useDebts';
import { formatCurrency } from '@/lib/utils';
import type { PersonalDebt } from '@finance-app/shared';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  paidAt: z.string().min(1, 'La fecha de pago es requerida'),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface DebtPaymentModalProps {
  open: boolean;
  onClose: () => void;
  debt: PersonalDebt;
  onSuccess: () => void;
}

export function DebtPaymentModal({ open, onClose, debt, onSuccess }: DebtPaymentModalProps) {
  const { payDebt, isLoading, error } = usePayDebt();

  const remaining = debt.totalAmount - debt.paidAmount;

  const nowLocalIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: remaining,
      paidAt: nowLocalIso,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: remaining,
        paidAt: nowLocalIso,
        paymentMethod: undefined,
        notes: '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: PaymentFormValues) {
    const success = await payDebt(debt.id, {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paidAt: new Date(data.paidAt).toISOString(),
      notes: data.notes || undefined,
    });

    if (success) {
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">Registrar pago</DialogTitle>
        </DialogHeader>

        {/* Debt summary */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-[#1E293B]">{debt.creditorName}</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Total deuda</p>
              <p className="font-semibold text-[#1E3A5F]">
                {formatCurrency(debt.totalAmount, debt.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Ya pagado</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(debt.paidAmount, debt.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Pendiente</p>
              <p className="font-semibold text-amber-600">
                {formatCurrency(remaining, debt.currency)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto a pagar *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Método de pago *</Label>
            <Select
              onValueChange={(val) =>
                setValue('paymentMethod', val as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH')
              }
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Seleccionar método..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YAPE">Yape</SelectItem>
                <SelectItem value="PLIN">Plin</SelectItem>
                <SelectItem value="BANK_TRANSFER">Transferencia bancaria</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-xs text-red-600">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Paid at */}
          <div className="space-y-1.5">
            <Label htmlFor="paidAt">Fecha y hora del pago *</Label>
            <Input
              id="paidAt"
              type="datetime-local"
              {...register('paidAt')}
            />
            {errors.paidAt && (
              <p className="text-xs text-red-600">{errors.paidAt.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Observaciones del pago..."
              className="flex min-h-[60px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              {...register('notes')}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#1E3A5F] hover:bg-[#2E86AB]"
            >
              {isLoading ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
