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
import { useCreateLoan } from '@/hooks/useLoans';
import { formatCurrency } from '@/lib/utils';

const loanSchema = z.object({
  borrowerName: z.string().min(1, 'El nombre es requerido'),
  borrowerContact: z.string().optional(),
  principal: z.coerce.number().positive('El monto debe ser mayor a 0'),
  currency: z.enum(['PEN', 'USD']),
  numberOfInstallments: z.coerce.number().int().min(1, 'Mínimo 1 cuota').max(60, 'Máximo 60 cuotas'),
  deliveryMethod: z.enum(['YAPE', 'PLIN', 'BANK_TRANSFER', 'CASH']),
  loanDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function calculatePreview(principal: number, numberOfInstallments: number) {
  if (!principal || !numberOfInstallments || principal <= 0 || numberOfInstallments <= 0) return null;
  const interestRate = principal < 1000 ? 0.15 : 0.20;
  const interestAmount = principal * interestRate;
  const totalAmount = principal + interestAmount;
  const installmentAmount = Math.round((totalAmount / numberOfInstallments) * 100) / 100;
  return { interestRate, interestAmount, totalAmount, installmentAmount };
}

export function LoanFormModal({ open, onClose, onSuccess }: LoanFormModalProps) {
  const { createLoan, isLoading, error } = useCreateLoan();

  const today = new Date().toISOString().split('T')[0] ?? '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      currency: 'PEN',
      loanDate: today,
      numberOfInstallments: 1,
    },
  });

  const principal = watch('principal');
  const numberOfInstallments = watch('numberOfInstallments');
  const currency = watch('currency');
  const preview = calculatePreview(Number(principal), Number(numberOfInstallments));

  useEffect(() => {
    if (!open) {
      reset({ currency: 'PEN', loanDate: today, numberOfInstallments: 1 });
    }
  }, [open, reset, today]);

  async function onSubmit(data: LoanFormValues) {
    const result = await createLoan({
      ...data,
      loanDate: new Date(data.loanDate).toISOString(),
      borrowerContact: data.borrowerContact || undefined,
      notes: data.notes || undefined,
    });
    if (result) {
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1E3A5F]">Nuevo Préstamo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="borrowerName">Nombre del prestatario *</Label>
              <Input
                id="borrowerName"
                placeholder="Ej: Juan Pérez"
                {...register('borrowerName')}
              />
              {errors.borrowerName && (
                <p className="text-xs text-red-600">{errors.borrowerName.message}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="borrowerContact">Contacto (opcional)</Label>
              <Input
                id="borrowerContact"
                placeholder="Teléfono o email"
                {...register('borrowerContact')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="principal">Monto principal *</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('principal')}
              />
              {errors.principal && (
                <p className="text-xs text-red-600">{errors.principal.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                defaultValue="PEN"
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

            <div className="space-y-1.5">
              <Label htmlFor="numberOfInstallments">N° de cuotas *</Label>
              <Input
                id="numberOfInstallments"
                type="number"
                min="1"
                max="60"
                placeholder="1"
                {...register('numberOfInstallments')}
              />
              {errors.numberOfInstallments && (
                <p className="text-xs text-red-600">{errors.numberOfInstallments.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deliveryMethod">Método de entrega *</Label>
              <Select onValueChange={(val) => setValue('deliveryMethod', val as 'YAPE' | 'PLIN' | 'BANK_TRANSFER' | 'CASH')}>
                <SelectTrigger id="deliveryMethod">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YAPE">Yape</SelectItem>
                  <SelectItem value="PLIN">Plin</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Transferencia bancaria</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                </SelectContent>
              </Select>
              {errors.deliveryMethod && (
                <p className="text-xs text-red-600">{errors.deliveryMethod.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loanDate">Fecha del préstamo *</Label>
              <Input
                id="loanDate"
                type="date"
                {...register('loanDate')}
              />
              {errors.loanDate && (
                <p className="text-xs text-red-600">{errors.loanDate.message}</p>
              )}
            </div>

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

          {preview && (
            <Card className="bg-slate-50 border-[#2E86AB]/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-3">
                  Vista previa del cálculo
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Tasa de interés</p>
                    <p className="font-semibold text-[#1E293B]">
                      {(preview.interestRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Monto de interés</p>
                    <p className="font-semibold text-[#1E293B]">
                      {formatCurrency(preview.interestAmount, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Total a cobrar</p>
                    <p className="font-bold text-[#1E3A5F]">
                      {formatCurrency(preview.totalAmount, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Monto por cuota</p>
                    <p className="font-bold text-[#2E86AB]">
                      {formatCurrency(preview.installmentAmount, currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              {isLoading ? 'Guardando...' : 'Crear préstamo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
