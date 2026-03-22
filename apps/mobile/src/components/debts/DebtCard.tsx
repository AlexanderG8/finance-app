import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Debt, DebtStatus } from '@/hooks/useDebts';

const STATUS_CONFIG: Record<DebtStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: '#F4A261', bg: '#F4A26115' },
  PARTIAL: { label: 'Parcial', color: '#2E86AB', bg: '#2E86AB15' },
  PAID: { label: 'Pagada', color: '#28A745', bg: '#28A74515' },
};

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export function DebtCard({ debt, onEdit, onDelete }: DebtCardProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[debt.status];
  const remaining = debt.totalAmount - debt.paidAmount;
  const pct = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/debts/${debt.id}` as never)}
      className="bg-white rounded-2xl p-4 border border-slate-100 mb-3"
      activeOpacity={0.75}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
            <Text className="text-base">💳</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
              {debt.creditorName}
            </Text>
            {debt.dueDate ? (
              <Text className="text-xs text-slate-400">Vence: {formatDate(debt.dueDate)}</Text>
            ) : (
              <Text className="text-xs text-slate-300">Sin fecha de vencimiento</Text>
            )}
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: config.bg }}>
          <Text className="text-xs font-semibold" style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* Montos */}
      <View className="flex-row justify-between mb-3">
        <View>
          <Text className="text-xs text-slate-400">Total</Text>
          <Text className="text-sm font-semibold text-slate-700">{formatCurrency(debt.totalAmount)}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-slate-400">Pagado</Text>
          <Text className="text-sm font-semibold text-green-600">{formatCurrency(debt.paidAmount)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400">Pendiente</Text>
          <Text className="text-sm font-semibold text-red-500">{formatCurrency(remaining)}</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#28A745' }}
        />
      </View>

      {/* Acciones */}
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-slate-400">{pct.toFixed(0)}% pagado · Ver pagos ›</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => onEdit(debt)}>
            <Text className="text-xs text-accent">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(debt.id)}>
            <Text className="text-xs text-red-400">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
