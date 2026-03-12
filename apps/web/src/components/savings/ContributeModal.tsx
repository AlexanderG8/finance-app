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
import { Progress } from '@/components/ui/progress';
import { useContribute } from '@/hooks/useSavings';
import { formatCurrency } from '@/lib/utils';
import type { SavingGoal } from '@finance-app/shared';

const contributeSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CASH']),
  contributedAt: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
});

type ContributeFormValues = z.infer<typeof contributeSchema>;

interface ContributeModalProps {
  open: boolean;
  onClose: () => void;
  goal: SavingGoal;
  onSuccess: () => void;
}

export function ContributeModal({ open, onClose, goal, onSuccess }: ContributeModalProps) {
  const { contribute, isLoading, error } = useContribute();

  const remaining = goal.targetAmount - goal.currentAmount;
  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const nowLocalIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContributeFormValues>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      contributedAt: nowLocalIso,
      paymentMethod: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        contributedAt: nowLocalIso,
        paymentMethod: undefined,
        notes: '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: ContributeFormValues) {
    const success = await contribute(goal.id, {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      contributedAt: new Date(data.contributedAt).toISOString(),
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
          <DialogTitle className="text-[#1E3A5F]">Registrar aporte</DialogTitle>
        </DialogHeader>

        {/* Goal summary */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <p className="font-semibold text-[#1E293B]">{goal.name}</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Ahorrado</p>
              <p className="font-semibold text-[#1E3A5F]">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Objetivo</p>
              <p className="font-semibold text-slate-700">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Restante</p>
              <p className="font-semibold text-amber-600">
                {formatCurrency(remaining, goal.currency)}
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">Progreso</span>
              <span className="text-xs font-medium text-[#1E3A5F]">
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto del aporte *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Payment method — ONLY BANK_TRANSFER and CASH for savings */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Método de depósito *</Label>
            <Select
              onValueChange={(val) =>
                setValue('paymentMethod', val as 'BANK_TRANSFER' | 'CASH')
              }
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Seleccionar método..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Transferencia bancaria</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-xs text-red-600">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Contributed at */}
          <div className="space-y-1.5">
            <Label htmlFor="contributedAt">Fecha y hora del aporte *</Label>
            <Input
              id="contributedAt"
              type="datetime-local"
              {...register('contributedAt')}
            />
            {errors.contributedAt && (
              <p className="text-xs text-red-600">{errors.contributedAt.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Observaciones del aporte..."
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
              {isLoading ? 'Registrando...' : 'Registrar aporte'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
