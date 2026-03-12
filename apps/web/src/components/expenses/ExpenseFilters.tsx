'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';

const EXPENSE_PAYMENT_METHODS = [
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CASH', label: 'Efectivo' },
] as const;

interface ExpenseFiltersProps {
  month: number;
  year: number;
  categoryId: string;
  paymentMethod: string;
  onMonthChange: (month: number, year: number) => void;
  onCategoryChange: (categoryId: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onClearFilters: () => void;
}

export function ExpenseFilters({
  month,
  year,
  categoryId,
  paymentMethod,
  onMonthChange,
  onCategoryChange,
  onPaymentMethodChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const { categories } = useCategories();

  const currentDate = new Date(year, month - 1, 1);
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: es });

  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    onMonthChange(prev.getMonth() + 1, prev.getFullYear());
  };

  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    onMonthChange(next.getMonth() + 1, next.getFullYear());
  };

  const hasActiveFilters = categoryId !== '' || paymentMethod !== '';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Navegación de mes */}
      <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-md px-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:text-[#2E86AB]"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-[#1E3A5F] w-32 text-center capitalize">
          {monthLabel}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:text-[#2E86AB]"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtro por categoría */}
      <div className="w-44">
        <Select value={categoryId || 'all'} onValueChange={(v) => onCategoryChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por método de pago */}
      <div className="w-44">
        <Select value={paymentMethod || 'all'} onValueChange={(v) => onPaymentMethodChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Todos los métodos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los métodos</SelectItem>
            {EXPENSE_PAYMENT_METHODS.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 gap-1 text-slate-500 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
