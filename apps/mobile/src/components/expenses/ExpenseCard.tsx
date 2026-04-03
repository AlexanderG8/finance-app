import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Expense } from '@/hooks/useExpenses';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: 'Tarjeta',
  YAPE: 'Yape',
  PLIN: 'Plin',
  CASH: 'Efectivo',
};

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <View className="bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2 flex-row items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: expense.category.color + '20' }}
      >
        <Text className="text-lg">{expense.category.emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
          {expense.description}
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          {expense.category.name} · {PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod} · {formatShortDate(expense.date)}
        </Text>
      </View>

      <View className="items-end ml-2">
        <Text className="text-sm font-bold text-red-500">
          -{formatCurrency(expense.amount)}
        </Text>
        <View className="flex-row gap-3 mt-1">
          <TouchableOpacity onPress={() => onEdit(expense)}>
            <Text className="text-xs text-accent">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(expense.id)}>
            <Text className="text-xs text-red-400">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
