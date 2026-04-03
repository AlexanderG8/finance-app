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
import { useCategories } from '@/hooks/useCategories';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useCreditCards } from '@/hooks/useCreditCards';
import type { Expense } from '@finance-app/shared';

const EXPENSE_PAYMENT_METHODS = ['CREDIT_CARD', 'YAPE', 'PLIN', 'CASH'] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta de crédito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  CASH: 'Efectivo',
};

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(255),
  amount: z
    .number({ invalid_type_error: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  paymentMethod: z.enum(['CREDIT_CARD', 'YAPE', 'PLIN', 'CASH'], {
    required_error: 'El método de pago es requerido',
  }),
  creditCardId: z.string().optional().nullable(),
  date: z.string().min(1, 'La fecha es requerida'),
  currency: z.enum(['PEN', 'USD']),
  isRecurring: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess: () => void;
}

export function ExpenseFormModal({ open, onClose, expense, onSuccess }: ExpenseFormModalProps) {
  const { categories } = useCategories();
  const { cards } = useCreditCards();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const isEditing = !!expense;
  const mutation = isEditing ? updateExpense : createExpense;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      categoryId: '',
      paymentMethod: 'CASH',
      creditCardId: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: 'PEN',
      isRecurring: false,
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          description: expense.description,
          amount: expense.amount,
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod as 'CREDIT_CARD' | 'YAPE' | 'PLIN' | 'CASH',
          creditCardId: expense.creditCardId ?? null,
          date: format(new Date(expense.date), 'yyyy-MM-dd'),
          currency: expense.currency,
          isRecurring: expense.isRecurring,
          notes: expense.notes ?? '',
        });
      } else {
        reset({
          description: '',
          amount: 0,
          categoryId: '',
          paymentMethod: 'CASH',
          creditCardId: null,
          date: format(new Date(), 'yyyy-MM-dd'),
          currency: 'PEN',
          isRecurring: false,
          notes: '',
        });
      }
    }
  }, [open, expense, reset]);

  const onSubmit = async (values: ExpenseFormValues) => {
    const payload = {
      ...values,
      date: new Date(values.date).toISOString(),
      notes: values.notes || undefined,
      creditCardId: values.paymentMethod === 'CREDIT_CARD' ? (values.creditCardId ?? null) : null,
    };

    let result: Expense | null = null;

    if (isEditing && expense) {
      result = await updateExpense.execute({ ...payload, id: expense.id });
    } else {
      result = await createExpense.execute(payload);
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
            {isEditing ? 'Editar gasto' : 'Nuevo gasto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Almuerzo en restaurante"
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

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-xs text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PAYMENT_METHODS.map((method) => (
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

          {/* Tarjeta de crédito — solo cuando paymentMethod es CREDIT_CARD */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="space-y-1.5">
              <Label>Tarjeta de crédito (opcional)</Label>
              <Controller
                name="creditCardId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tarjeta..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tarjeta específica</SelectItem>
                      {cards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.entityName} ({card.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {cards.length === 0 && (
                <p className="text-xs text-slate-400">
                  No tienes tarjetas registradas. Agrégalas en la sección "Tarjetas de crédito".
                </p>
              )}
            </div>
          )}

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
              Gasto recurrente (se repite mensualmente)
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
              className="bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
            >
              {mutation.isLoading
                ? isEditing
                  ? 'Guardando...'
                  : 'Creando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
