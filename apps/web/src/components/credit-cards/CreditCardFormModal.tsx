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
import { useCreateCreditCard, useUpdateCreditCard } from '@/hooks/useCreditCards';
import type { CreditCard } from '@finance-app/shared';

const creditCardSchema = z.object({
  entityName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  cycleStartDay: z.coerce
    .number()
    .int()
    .min(1, 'Debe estar entre 1 y 28.')
    .max(28, 'Debe estar entre 1 y 28.'),
  paymentDueDay: z.coerce
    .number()
    .int()
    .min(1, 'Debe estar entre 1 y 28.')
    .max(28, 'Debe estar entre 1 y 28.'),
  currency: z.enum(['PEN', 'USD']),
  creditLimit: z.coerce.number().positive('Debe ser mayor a 0.').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CreditCardFormValues = z.infer<typeof creditCardSchema>;

interface CreditCardFormModalProps {
  open: boolean;
  onClose: () => void;
  card?: CreditCard;
  onSuccess: () => void;
}

export function CreditCardFormModal({ open, onClose, card, onSuccess }: CreditCardFormModalProps) {
  const { createCreditCard, isLoading: isCreating, error: createError } = useCreateCreditCard();
  const { updateCreditCard, isLoading: isUpdating, error: updateError } = useUpdateCreditCard();

  const isEditing = Boolean(card);
  const isLoading = isCreating || isUpdating;
  const error = createError ?? updateError;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: { currency: 'PEN' },
  });

  const currency = watch('currency');

  useEffect(() => {
    if (open && card) {
      reset({
        entityName: card.entityName,
        cycleStartDay: card.cycleStartDay,
        paymentDueDay: card.paymentDueDay,
        currency: card.currency,
        creditLimit: card.creditLimit ?? undefined,
        notes: card.notes ?? '',
      });
    } else if (!open) {
      reset({ currency: 'PEN' });
    }
  }, [open, card, reset]);

  async function onSubmit(data: CreditCardFormValues) {
    const payload = {
      entityName: data.entityName,
      cycleStartDay: data.cycleStartDay,
      paymentDueDay: data.paymentDueDay,
      currency: data.currency,
      creditLimit: data.creditLimit ? Number(data.creditLimit) : undefined,
      notes: data.notes || undefined,
    };

    let result: CreditCard | null = null;
    if (isEditing && card) {
      result = await updateCreditCard(card.id, payload);
    } else {
      result = await createCreditCard(payload);
    }

    if (result) {
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">
            {isEditing ? 'Editar tarjeta' : 'Nueva tarjeta de crédito'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Entity name */}
          <div className="space-y-1.5">
            <Label htmlFor="entityName">Entidad financiera *</Label>
            <Input
              id="entityName"
              placeholder="Ej: BCP, BBVA, Interbank, Scotiabank"
              {...register('entityName')}
            />
            {errors.entityName && (
              <p className="text-xs text-red-600">{errors.entityName.message}</p>
            )}
          </div>

          {/* Cycle start day + payment due day */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cycleStartDay">Día inicio de ciclo *</Label>
              <Input
                id="cycleStartDay"
                type="number"
                min="1"
                max="28"
                placeholder="Ej: 11"
                {...register('cycleStartDay')}
              />
              <p className="text-xs text-slate-400">Día del mes (1–28)</p>
              {errors.cycleStartDay && (
                <p className="text-xs text-red-600">{errors.cycleStartDay.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentDueDay">Día límite de pago *</Label>
              <Input
                id="paymentDueDay"
                type="number"
                min="1"
                max="28"
                placeholder="Ej: 5"
                {...register('paymentDueDay')}
              />
              <p className="text-xs text-slate-400">Día del mes siguiente al cierre</p>
              {errors.paymentDueDay && (
                <p className="text-xs text-red-600">{errors.paymentDueDay.message}</p>
              )}
            </div>
          </div>

          {/* Currency + Credit limit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={currency}
                onValueChange={(val) => setValue('currency', val as 'PEN' | 'USD')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN (Soles)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Límite de crédito (opcional)</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('creditLimit')}
              />
              {errors.creditLimit && (
                <p className="text-xs text-red-600">{errors.creditLimit.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Observaciones..."
              className="flex min-h-[60px] w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E86AB] focus:ring-offset-2 resize-none"
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
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear tarjeta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
