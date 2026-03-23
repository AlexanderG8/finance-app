import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Loan, LoanStatus } from '@/hooks/useLoans';

const STATUS_CONFIG: Record<LoanStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activo',     color: '#2E86AB', bg: '#2E86AB15' },
  COMPLETED: { label: 'Completado', color: '#28A745', bg: '#28A74515' },
  OVERDUE:   { label: 'Vencido',    color: '#E63946', bg: '#E6394615' },
};

interface LoanCardProps {
  loan: Loan;
  onDelete?: () => void;
}

export function LoanCard({ loan, onDelete }: LoanCardProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[loan.status];

  function handleDeletePress() {
    Alert.alert(
      'Eliminar préstamo',
      `¿Estás seguro de que deseas eliminar el préstamo de "${loan.borrowerName}"? Se eliminarán todas las cuotas y pagos. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete?.() },
      ]
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/loans/${loan.id}` as never)}
      className="bg-white rounded-2xl p-4 border border-slate-100 mb-3"
      activeOpacity={0.75}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
            <Text className="text-base">🤝</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
              {loan.borrowerName}
            </Text>
            {loan.borrowerContact ? (
              <Text className="text-xs text-slate-400">{loan.borrowerContact}</Text>
            ) : null}
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: config.bg }}>
          <Text className="text-xs font-semibold" style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-xs text-slate-400">Principal</Text>
          <Text className="text-sm font-semibold text-slate-700">{formatCurrency(loan.principal)}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-slate-400">Total c/interés</Text>
          <Text className="text-sm font-semibold text-primary">{formatCurrency(loan.totalAmount)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400">Cuota mensual</Text>
          <Text className="text-sm font-semibold text-slate-700">{formatCurrency(loan.installmentAmount)}</Text>
        </View>
      </View>

      {loan.totalProfit > 0 && (
        <View className="mb-2 flex-row items-center gap-1">
          <Text className="text-xs text-green-600 font-medium">
            Ganancia: {formatCurrency(loan.totalProfit)}
          </Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-slate-400">
          {loan.numberOfInstallments} cuotas · {formatDate(loan.loanDate)}
        </Text>
        <View className="flex-row items-center gap-3">
          {onDelete && (
            <TouchableOpacity onPress={handleDeletePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-xs text-red-500">🗑</Text>
            </TouchableOpacity>
          )}
          <Text className="text-xs text-accent font-medium">Ver detalle ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
