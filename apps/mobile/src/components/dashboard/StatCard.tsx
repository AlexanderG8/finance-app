import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface StatCardProps {
  label: string;
  value: string;
  emoji: string;
  color: string;
  subtitle?: string;
}

export function StatCard({ label, value, emoji, color, subtitle }: StatCardProps) {
  return (
    <View
      className="flex-1 bg-white rounded-2xl p-4 border border-slate-100"
      style={{ minWidth: '45%' }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Text className="text-base">{emoji}</Text>
        </View>
        <Text className="text-xs text-slate-500 flex-1 leading-tight">{label}</Text>
      </View>
      <Text className="text-lg font-bold" style={{ color: Colors.textPrimary }}>
        {value}
      </Text>
      {subtitle && (
        <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text>
      )}
    </View>
  );
}
