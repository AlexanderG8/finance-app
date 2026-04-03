import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  category: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  total: number;
  count: number;
}

interface ExpensesPieChartProps {
  categories: CategoryData[];
}

export function ExpensesPieChart({ categories }: ExpensesPieChartProps) {
  if (categories.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 border border-slate-100 items-center py-8">
        <Text className="text-2xl mb-2">💸</Text>
        <Text className="text-slate-400 text-sm">Sin gastos este mes</Text>
      </View>
    );
  }

  const total = categories.reduce((sum, c) => sum + c.total, 0);

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100">
      <Text className="text-sm font-semibold text-primary mb-4">Gastos por categoría</Text>

      {categories.slice(0, 6).map((cat) => {
        const percentage = total > 0 ? (cat.total / total) * 100 : 0;
        return (
          <View key={cat.category.id} className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-600">
                {cat.category.emoji} {cat.category.name}
              </Text>
              <View className="flex-row gap-2 items-center">
                <Text className="text-xs text-slate-400">{percentage.toFixed(0)}%</Text>
                <Text className="text-xs font-semibold text-slate-700">
                  {formatCurrency(cat.total)}
                </Text>
              </View>
            </View>
            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: cat.category.color }}
              />
            </View>
          </View>
        );
      })}

      <View className="mt-2 pt-3 border-t border-slate-100 flex-row justify-between">
        <Text className="text-xs text-slate-500">Total</Text>
        <Text className="text-xs font-bold text-slate-800">{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}
