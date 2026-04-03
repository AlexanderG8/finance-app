import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useCreditCardCycle } from '@/hooks/useCreditCards';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';

interface CreditCardCycleSummaryProps {
  cardId: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export function CreditCardCycleSummary({ cardId }: CreditCardCycleSummaryProps) {
  const { summary, isLoading, fetchCycle } = useCreditCardCycle();

  useEffect(() => {
    fetchCycle(cardId);
  }, [cardId, fetchCycle]);

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} size="small" />;
  }

  if (!summary) return null;

  const { totalSpent, creditLimit, usagePercentage, cycleStart, cycleEnd, paymentDueDate, daysUntilPayment } = summary;

  const urgencyColor =
    daysUntilPayment <= 5 ? '#E63946' : daysUntilPayment <= 10 ? '#F4A261' : '#28A745';

  const barColor =
    usagePercentage !== null && usagePercentage >= 90
      ? '#E63946'
      : usagePercentage !== null && usagePercentage >= 70
      ? '#F4A261'
      : '#28A745';

  return (
    <View className="space-y-2">
      {/* Ciclo */}
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-slate-400">
          Ciclo: {formatDate(cycleStart)} → {formatDate(cycleEnd)}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: urgencyColor }}>
          {daysUntilPayment > 0
            ? `Pago en ${daysUntilPayment}d`
            : daysUntilPayment === 0
            ? 'Vence hoy'
            : 'Vencido'}
        </Text>
      </View>

      {/* Total consumido */}
      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-xs text-slate-400">Consumido</Text>
          <Text className="text-xl font-bold text-primary">{formatCurrency(totalSpent)}</Text>
        </View>
        {creditLimit !== null && (
          <View className="items-end">
            <Text className="text-xs text-slate-400">Límite</Text>
            <Text className="text-sm font-semibold text-slate-600">{formatCurrency(creditLimit)}</Text>
          </View>
        )}
      </View>

      {/* Barra de uso */}
      {creditLimit !== null && usagePercentage !== null && (
        <View>
          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: barColor,
              }}
            />
          </View>
          <Text className="text-xs text-slate-400 mt-0.5">{usagePercentage}% utilizado</Text>
        </View>
      )}

      {/* Fecha límite */}
      <View className="bg-slate-50 rounded-lg px-3 py-2">
        <Text className="text-xs text-slate-500">
          Pago límite:{' '}
          <Text className="font-semibold" style={{ color: urgencyColor }}>
            {formatDate(paymentDueDate)}
          </Text>
        </Text>
      </View>
    </View>
  );
}
