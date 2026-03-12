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
import { Card, CardContent } from '@/components/ui/card';
import { InstallmentStatusBadge } from './LoanStatusBadge';
import { usePayInstallment } from '@/hooks/useLoans';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LoanInstallment } from '@finance-app/shared';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  paidAt: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  loanId: string;
  installment: LoanInstallment;
  onSuccess: () => void;
}

export function PaymentModal({ open, onClose, loanId, installment, onSuccess }: PaymentModalProps) {
  const { payInstallment, isLoading, error } = usePayInstallment();

  const remaining = installment.amount - installment.paidAmount;

  const nowLocal = new Date();
  const localDatetime = new Date(nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60000)
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
      amount: remaining > 0 ? remaining : installment.amount,
      paidAt: localDatetime,
    },
  });

  useEffect(() => {
    if (open) {
      const now = new Date();
      const localDt = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      reset({
        amount: remaining > 0 ? remaining : installment.amount,
        paidAt: localDt,
      });
    }
  }, [open, installment, remaining, reset]);

  async function onSubmit(data: PaymentFormValues) {
    const success = await payInstallment(loanId, installment.id, {
      ...data,
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
          <DialogTitle className="text-[#1E3A5F]">Registrar pago — Cuota #{installment.number}</DialogTitle>
        </DialogHeader>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
                <p className="font-medium text-[#1E293B]">{formatDate(installment.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Monto total</p>
                <p className="font-medium text-[#1E293B]">{formatCurrency(installment.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Estado</p>
                <InstallmentStatusBadge status={installment.status} />
              </div>
              {installment.paidAmount > 0 && (
                <>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Ya pagado</p>
                    <p className="font-medium text-green-600">{formatCurrency(installment.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pendiente</p>
                    <p className="font-bold text-amber-500">{formatCurrency(remaining)}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto a pagar *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Método de pago *</Label>
            <Select onValueChange={(val) => setValue('paymentMethod', val as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH')}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Seleccionar..." />
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
              {isLoading ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
