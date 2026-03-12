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
import { useCreateSavingGoal, useUpdateSavingGoal } from '@/hooks/useSavings';
import type { SavingGoal, SavingGoalType } from '@finance-app/shared';

const savingGoalSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['OBJECTIVE', 'EMERGENCY', 'CUSTOM']),
  targetAmount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['PEN', 'USD']),
  targetDate: z.string().optional().or(z.literal('')),
  monthlyContribution: z.coerce
    .number()
    .positive('Debe ser mayor a 0')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

type SavingGoalFormValues = z.infer<typeof savingGoalSchema>;

interface SavingGoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goal?: SavingGoal;
  onSuccess: () => void;
}

export function SavingGoalFormModal({ open, onClose, goal, onSuccess }: SavingGoalFormModalProps) {
  const { createGoal, isLoading: isCreating, error: createError } = useCreateSavingGoal();
  const { updateGoal, isLoading: isUpdating, error: updateError } = useUpdateSavingGoal();

  const isEditing = Boolean(goal);
  const isLoading = isCreating || isUpdating;
  const error = createError ?? updateError;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<SavingGoalFormValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: {
      currency: 'PEN',
      type: 'CUSTOM',
    },
  });

  const currency = watch('currency');
  const type = watch('type');

  useEffect(() => {
    if (open && goal) {
      reset({
        name: goal.name,
        type: goal.type,
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
        monthlyContribution: goal.monthlyContribution ?? undefined,
        notes: goal.notes ?? '',
      });
    } else if (!open) {
      reset({
        currency: 'PEN',
        type: 'CUSTOM',
      });
    }
  }, [open, goal, reset]);

  async function onSubmit(data: SavingGoalFormValues) {
    const payload = {
      name: data.name,
      type: data.type,
      targetAmount: data.targetAmount,
      currency: data.currency,
      targetDate:
        data.targetDate && data.targetDate !== ''
          ? new Date(data.targetDate).toISOString()
          : undefined,
      monthlyContribution:
        data.monthlyContribution
          ? Number(data.monthlyContribution)
          : undefined,
      notes: data.notes || undefined,
    };

    let result: SavingGoal | null = null;

    if (isEditing && goal) {
      result = await updateGoal(goal.id, payload);
    } else {
      result = await createGoal(payload);
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
            {isEditing ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">Nombre de la meta *</Label>
              <Input
                id="name"
                placeholder="Ej: Viaje a Europa, Fondo de emergencia"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo de meta</Label>
              <Select
                value={type}
                onValueChange={(val) => setValue('type', val as SavingGoalType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OBJECTIVE">Objetivo</SelectItem>
                  <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Target amount */}
            <div className="space-y-1.5">
              <Label htmlFor="targetAmount">Monto objetivo *</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('targetAmount')}
              />
              {errors.targetAmount && (
                <p className="text-xs text-red-600">{errors.targetAmount.message}</p>
              )}
            </div>

            {/* Monthly contribution */}
            <div className="space-y-1.5">
              <Label htmlFor="monthlyContribution">Contribución mensual (opcional)</Label>
              <Input
                id="monthlyContribution"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('monthlyContribution')}
              />
              {errors.monthlyContribution && (
                <p className="text-xs text-red-600">{errors.monthlyContribution.message}</p>
              )}
            </div>

            {/* Target date */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>
              <Input
                id="targetDate"
                type="date"
                {...register('targetDate')}
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Descripción u observaciones..."
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
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
