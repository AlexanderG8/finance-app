import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { Income, IncomeSource } from '@/hooks/useIncomes';

const SOURCE_CONFIG: Record<IncomeSource, { label: string; emoji: string; color: string }> = {
  SALARY:     { label: 'Sueldo',     emoji: '💼', color: '#2E86AB' },
  FREELANCE:  { label: 'Freelance',  emoji: '💻', color: '#28A745' },
  BUSINESS:   { label: 'Negocio',    emoji: '🏪', color: '#F4A261' },
  INVESTMENT: { label: 'Inversión',  emoji: '📈', color: '#1E3A5F' },
  RENTAL:     { label: 'Alquiler',   emoji: '🏠', color: '#96CEB4' },
  OTHER:      { label: 'Otro',       emoji: '💰', color: '#BDC3C7' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  YAPE:          'Yape',
  PLIN:          'Plin',
  BANK_TRANSFER: 'Transferencia',
  CASH:          'Efectivo',
};

interface IncomeCardProps {
  income: Income;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export function IncomeCard({ income, onEdit, onDelete }: IncomeCardProps) {
  const config = SOURCE_CONFIG[income.source] ?? SOURCE_CONFIG.OTHER;

  return (
    <View className="bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2 flex-row items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: config.color + '20' }}
      >
        <Text className="text-lg">{config.emoji}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
          {income.description}
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          {config.label} · {PAYMENT_METHOD_LABELS[income.paymentMethod] ?? income.paymentMethod} · {formatShortDate(income.date)}
        </Text>
      </View>

      <View className="items-end ml-2">
        <Text className="text-sm font-bold text-green-600">
          +{formatCurrency(income.amount)}
        </Text>
        <View className="flex-row gap-3 mt-1">
          <TouchableOpacity onPress={() => onEdit(income)}>
            <Text className="text-xs text-accent">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(income.id)}>
            <Text className="text-xs text-red-400">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
