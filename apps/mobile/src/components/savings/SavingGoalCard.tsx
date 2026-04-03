import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SavingGoal, GoalType, GoalStatus } from '@/hooks/useSavings';

const TYPE_CONFIG: Record<GoalType, { emoji: string; label: string }> = {
  OBJECTIVE: { emoji: '🎯', label: 'Objetivo' },
  EMERGENCY: { emoji: '🆘', label: 'Emergencia' },
  CUSTOM:    { emoji: '⭐', label: 'Personalizado' },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: 'En progreso', color: '#2E86AB', bg: '#2E86AB15' },
  COMPLETED:   { label: 'Completada',  color: '#28A745', bg: '#28A74515' },
  PAUSED:      { label: 'Pausada',     color: '#94a3b8', bg: '#94a3b815' },
};

interface SavingGoalCardProps {
  goal: SavingGoal;
  onEdit: (goal: SavingGoal) => void;
  onDelete: (id: string) => void;
}

export function SavingGoalCard({ goal, onEdit, onDelete }: SavingGoalCardProps) {
  const router = useRouter();
  const typeConfig = TYPE_CONFIG[goal.type];
  const statusConfig = STATUS_CONFIG[goal.status];
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/savings/${goal.id}` as never)}
      className="bg-white rounded-2xl p-4 border border-slate-100 mb-3"
      activeOpacity={0.75}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
            <Text className="text-base">{typeConfig.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
              {goal.name}
            </Text>
            <Text className="text-xs text-slate-400">{typeConfig.label}</Text>
          </View>
        </View>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: statusConfig.bg }}>
          <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Montos */}
      <View className="flex-row justify-between mb-2">
        <View>
          <Text className="text-xs text-slate-400">Ahorrado</Text>
          <Text className="text-sm font-bold text-green-600">{formatCurrency(goal.currentAmount)}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-slate-400">Meta</Text>
          <Text className="text-sm font-bold text-primary">{formatCurrency(goal.targetAmount)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-400">Restante</Text>
          <Text className="text-sm font-semibold text-amber-500">{formatCurrency(Math.max(remaining, 0))}</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? '#28A745' : '#F4A261',
          }}
        />
      </View>

      {/* Footer */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-3 items-center">
          <Text className="text-xs text-slate-400">{pct.toFixed(0)}%</Text>
          {goal.targetDate && (
            <Text className="text-xs text-slate-400">Meta: {formatDate(goal.targetDate)}</Text>
          )}
          {goal.monthlyContribution && (
            <Text className="text-xs text-slate-400">
              {formatCurrency(goal.monthlyContribution)}/mes
            </Text>
          )}
        </View>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={() => onEdit(goal)}>
            <Text className="text-xs text-accent">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(goal.id)}>
            <Text className="text-xs text-red-400">Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
