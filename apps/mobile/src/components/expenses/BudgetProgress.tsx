import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency } from '@/lib/utils';
import { BudgetComparison } from '@/hooks/useBudgetComparison';
import { Colors } from '@/constants/colors';

interface BudgetProgressProps {
  comparisons: BudgetComparison[];
  onEdit: (item: BudgetComparison) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function getBarColor(percentage: number): string {
  if (percentage >= 100) return Colors.danger;
  if (percentage >= 80) return Colors.warning;
  return Colors.success;
}

export function BudgetProgress({ comparisons, onEdit, onDelete, onAdd }: BudgetProgressProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-sm font-semibold text-primary">Presupuesto vs Gasto</Text>
        <TouchableOpacity
          onPress={onAdd}
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: Colors.primary }}
        >
          <Text className="text-white text-xs font-bold">+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {comparisons.length === 0 ? (
        <View className="items-center py-6">
          <Text className="text-2xl mb-2">📊</Text>
          <Text className="text-slate-400 text-sm">Sin presupuestos este mes</Text>
          <Text className="text-slate-300 text-xs mt-1">Toca "+ Agregar" para crear uno</Text>
        </View>
      ) : (
        comparisons.map((item) => {
          const pct = Math.min(item.percentage, 100);
          const barColor = getBarColor(item.percentage);
          return (
            <View key={item.budget.id} className="mb-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-slate-600">
                  {item.budget.category.emoji} {item.budget.category.name}
                </Text>
                <Text className="text-xs text-slate-400">
                  {formatCurrency(item.spent)} / {formatCurrency(item.budget.amount)}
                </Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <View className="flex-row gap-3">
                  <Text className="text-xs" style={{ color: barColor }}>
                    {item.percentage.toFixed(0)}% usado
                  </Text>
                  {item.remaining >= 0 ? (
                    <Text className="text-xs text-slate-400">
                      Resta {formatCurrency(item.remaining)}
                    </Text>
                  ) : (
                    <Text className="text-xs text-red-400">
                      Excedido {formatCurrency(Math.abs(item.remaining))}
                    </Text>
                  )}
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => onEdit(item)}>
                    <Text className="text-xs text-accent">Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.budget.id)}>
                    <Text className="text-xs text-red-400">Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
