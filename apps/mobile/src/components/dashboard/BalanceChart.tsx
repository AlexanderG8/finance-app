import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/utils';

interface BalanceChartProps {
  income: number;
  expenses: number;
  debtPayments: number;
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  emoji: string;
}

function BarRow({ label, value, maxValue, color, emoji }: BarRowProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-slate-500">
          {emoji} {label}
        </Text>
        <Text className="text-xs font-semibold text-slate-700">{formatCurrency(value)}</Text>
      </View>
      <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export function BalanceChart({ income, expenses, debtPayments }: BalanceChartProps) {
  const maxValue = Math.max(income, expenses, debtPayments, 1);
  const balance = income - expenses - debtPayments;
  const isPositive = balance >= 0;

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100">
      <Text className="text-sm font-semibold text-primary mb-4">Balance del mes</Text>
      <BarRow label="Ingresos" value={income} maxValue={maxValue} color={Colors.success} emoji="💰" />
      <BarRow label="Gastos" value={expenses} maxValue={maxValue} color={Colors.danger} emoji="💸" />
      <BarRow label="Pagos de deudas" value={debtPayments} maxValue={maxValue} color={Colors.warning} emoji="💳" />
      <View className="mt-3 pt-3 border-t border-slate-100 flex-row justify-between items-center">
        <Text className="text-xs text-slate-500">Ingresos − Gastos − Deudas</Text>
        <Text
          className="text-sm font-bold"
          style={{ color: isPositive ? Colors.success : Colors.danger }}
        >
          {isPositive ? '+' : ''}{formatCurrency(balance)}
        </Text>
      </View>
    </View>
  );
}
