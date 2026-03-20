'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useCategories } from '@/hooks/useCategories';
import { useUpsertBudget } from '@/hooks/useBudgets';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  amount: z
    .number({ invalid_type_error: 'El monto debe ser un número' })
    .positive('El monto debe ser mayor a 0'),
  currency: z.enum(['PEN', 'USD']),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMonth: number;
  defaultYear: number;
  defaultCategoryName?: string;
  defaultAmount?: number;
}

export function BudgetFormModal({
  open,
  onClose,
  onSuccess,
  defaultMonth,
  defaultYear,
  defaultCategoryName,
  defaultAmount,
}: BudgetFormModalProps) {
  const { categories } = useCategories();
  const { isLoading, error, execute } = useUpsertBudget();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
      currency: 'PEN',
      month: defaultMonth,
      year: defaultYear,
    },
  });

  useEffect(() => {
    if (open) {
      const preselectedId = defaultCategoryName
        ? (categories.find((c) => c.name.toLowerCase() === defaultCategoryName.toLowerCase())?.id ?? '')
        : '';
      reset({
        categoryId: preselectedId,
        amount: defaultAmount ?? 0,
        currency: 'PEN',
        month: defaultMonth,
        year: defaultYear,
      });
    }
  }, [open, defaultMonth, defaultYear, defaultCategoryName, defaultAmount, categories, reset]);

  const onSubmit = async (values: BudgetFormValues) => {
    const result = await execute(values);
    if (result) {
      onSuccess();
      onClose();
    }
  };

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">Agregar presupuesto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
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
                        {cat.emoji} {cat.name}
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

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="budget-amount">Monto máximo</Label>
              <Input
                id="budget-amount"
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

          {/* Mes y Año */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((name, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-year">Año</Label>
              <Input
                id="budget-year"
                type="number"
                min="2020"
                max="2100"
                {...register('year', { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-xs text-red-600">{errors.year.message}</p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#1E3A5F] hover:bg-[#2E86AB] text-white"
            >
              {isLoading ? 'Guardando...' : 'Guardar presupuesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
