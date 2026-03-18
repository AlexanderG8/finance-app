'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import { useCreateIncome, useUpdateIncome } from '@/hooks/useIncomes';
import type { Income } from '@finance-app/shared';
import { INCOME_SOURCE_LABELS } from '@finance-app/shared';

const INCOME_PAYMENT_METHODS = ['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH'] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  BANK_TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo',
};

const INCOME_SOURCES = ['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'RENTAL', 'OTHER'] as const;

const incomeSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(200),
  amount: z
    .number({ invalid_type_error: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0'),
  currency: z.enum(['PEN', 'USD']),
  source: z.enum(['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'RENTAL', 'OTHER']),
  paymentMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  date: z.string().min(1, 'La fecha es requerida'),
  isRecurring: z.boolean(),
  notes: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

interface IncomeFormModalProps {
  open: boolean;
  onClose: () => void;
  income?: Income;
  onSuccess: () => void;
}

export function IncomeFormModal({ open, onClose, income, onSuccess }: IncomeFormModalProps) {
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();

  const isEditing = !!income;
  const mutation = isEditing ? updateIncome : createIncome;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      currency: 'PEN',
      source: 'OTHER',
      paymentMethod: 'CASH',
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (income) {
        reset({
          description: income.description,
          amount: income.amount,
          currency: income.currency,
          source: income.source,
          paymentMethod: income.paymentMethod as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH',
          date: format(new Date(income.date), 'yyyy-MM-dd'),
          isRecurring: income.isRecurring,
          notes: income.notes ?? '',
        });
      } else {
        reset({
          description: '',
          amount: 0,
          currency: 'PEN',
          source: 'OTHER',
          paymentMethod: 'CASH',
          date: format(new Date(), 'yyyy-MM-dd'),
          isRecurring: false,
          notes: '',
        });
      }
    }
  }, [open, income, reset]);

  const onSubmit = async (values: IncomeFormValues) => {
    const payload = {
      ...values,
      date: new Date(values.date).toISOString(),
      notes: values.notes || undefined,
    };

    let result: Income | null = null;

    if (isEditing && income) {
      result = await updateIncome.execute({ ...payload, id: income.id });
    } else {
      result = await createIncome.execute(payload);
    }

    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">
            {isEditing ? 'Editar ingreso' : 'Nuevo ingreso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Salario mensual"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN (S/)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Fuente */}
          <div className="space-y-1.5">
            <Label>Fuente de ingreso</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {INCOME_SOURCE_LABELS[src]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.source && (
              <p className="text-xs text-red-600">{errors.source.message}</p>
            )}
          </div>

          {/* Método de recepción */}
          <div className="space-y-1.5">
            <Label>Método de recepción</Label>
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentMethod && (
              <p className="text-xs text-red-600">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Notas adicionales..."
              {...register('notes')}
              className="flex w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 resize-none"
            />
          </div>

          {/* Recurrente */}
          <div className="flex items-center gap-2">
            <input
              id="isRecurring"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#2E86AB] focus:ring-[#2E86AB]"
              {...register('isRecurring')}
            />
            <Label htmlFor="isRecurring" className="cursor-pointer font-normal">
              Ingreso recurrente (se repite mensualmente)
            </Label>
          </div>

          {mutation.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {mutation.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isLoading}
              className="bg-[#28A745] hover:bg-[#1e7e34] text-white"
            >
              {mutation.isLoading
                ? isEditing
                  ? 'Guardando...'
                  : 'Creando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Registrar ingreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
