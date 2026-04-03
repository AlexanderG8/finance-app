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
import { useCreateDebt, useUpdateDebt } from '@/hooks/useDebts';
import type { PersonalDebt } from '@finance-app/shared';

const debtSchema = z.object({
  creditorName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  totalAmount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['PEN', 'USD']),
  debtType: z.enum(['CASH', 'CREDIT']),
  numberOfInstallments: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 cuota')
    .max(60, 'Máximo 60 cuotas')
    .optional()
    .or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  paymentMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  notes: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

interface DebtFormModalProps {
  open: boolean;
  onClose: () => void;
  debt?: PersonalDebt;
  onSuccess: () => void;
}

export function DebtFormModal({ open, onClose, debt, onSuccess }: DebtFormModalProps) {
  const { createDebt, isLoading: isCreating, error: createError } = useCreateDebt();
  const { updateDebt, isLoading: isUpdating, error: updateError } = useUpdateDebt();

  const isEditing = Boolean(debt);
  const isLoading = isCreating || isUpdating;
  const error = createError ?? updateError;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      currency: 'PEN',
      debtType: 'CASH',
      paymentMethod: undefined,
    },
  });

  const currency = watch('currency');
  const debtType = watch('debtType');

  useEffect(() => {
    if (open && debt) {
      reset({
        creditorName: debt.creditorName,
        totalAmount: debt.totalAmount,
        currency: debt.currency,
        debtType: debt.debtType as 'CASH' | 'CREDIT',
        numberOfInstallments: debt.numberOfInstallments ?? undefined,
        dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : '',
        paymentMethod: debt.paymentMethod as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH',
        notes: debt.notes ?? '',
      });
    } else if (!open) {
      reset({
        currency: 'PEN',
        debtType: 'CASH',
        paymentMethod: undefined,
      });
    }
  }, [open, debt, reset]);

  async function onSubmit(data: DebtFormValues) {
    const payload = {
      creditorName: data.creditorName,
      totalAmount: data.totalAmount,
      currency: data.currency,
      debtType: data.debtType,
      paymentMethod: data.paymentMethod,
      numberOfInstallments:
        data.numberOfInstallments
          ? Number(data.numberOfInstallments)
          : undefined,
      dueDate:
        data.dueDate && data.dueDate !== ''
          ? new Date(data.dueDate).toISOString()
          : undefined,
      notes: data.notes || undefined,
    };

    let result: PersonalDebt | null = null;

    if (isEditing && debt) {
      result = await updateDebt(debt.id, payload);
    } else {
      result = await createDebt(payload);
    }

    if (result) {
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">
            {isEditing ? 'Editar deuda' : 'Nueva deuda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Creditor name */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="creditorName">Nombre del acreedor *</Label>
              <Input
                id="creditorName"
                placeholder="Ej: Banco BCP, Juan Pérez"
                {...register('creditorName')}
              />
              {errors.creditorName && (
                <p className="text-xs text-red-600">{errors.creditorName.message}</p>
              )}
            </div>

            {/* Total amount */}
            <div className="space-y-1.5">
              <Label htmlFor="totalAmount">Monto total *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('totalAmount')}
              />
              {errors.totalAmount && (
                <p className="text-xs text-red-600">{errors.totalAmount.message}</p>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={currency}
                onValueChange={(val) => setValue('currency', val as 'PEN' | 'USD')}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN (Soles)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Debt type */}
            <div className="sm:col-span-2 space-y-2">
              <Label>Tipo de deuda *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('debtType', 'CASH', { shouldDirty: true, shouldValidate: true })}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                    debtType === 'CASH'
                      ? 'border-[#28A745] bg-green-50'
                      : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-[#1E293B]">Efectivo</span>
                  <span className="text-xs text-slate-500">Dinero recibido en mano o transferencia — suma a tu balance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('debtType', 'CREDIT', { shouldDirty: true, shouldValidate: true })}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                    debtType === 'CREDIT'
                      ? 'border-[#2E86AB] bg-blue-50'
                      : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-[#1E293B]">Crédito</span>
                  <span className="text-xs text-slate-500">Compra a crédito o tarjeta — no suma a tu balance</span>
                </button>
              </div>
            </div>

            {/* Number of installments */}
            <div className="space-y-1.5">
              <Label htmlFor="numberOfInstallments">N° de cuotas (opcional)</Label>
              <Input
                id="numberOfInstallments"
                type="number"
                min="1"
                max="60"
                placeholder="Ej: 12"
                {...register('numberOfInstallments')}
              />
              {errors.numberOfInstallments && (
                <p className="text-xs text-red-600">{errors.numberOfInstallments.message}</p>
              )}
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Fecha de vencimiento (opcional)</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>

            {/* Payment method */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="paymentMethod">Método de pago *</Label>
              <Select
                onValueChange={(val) =>
                  setValue('paymentMethod', val as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH')
                }
                defaultValue={debt?.paymentMethod}
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

            {/* Notes */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Observaciones adicionales..."
                className="flex min-h-[60px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register('notes')}
              />
            </div>
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
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear deuda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
