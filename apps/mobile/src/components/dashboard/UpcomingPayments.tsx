import { View, Text } from 'react-native';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { UpcomingPayment } from '@/hooks/useUpcomingPayments';

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  if (payments.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 border border-slate-100 items-center py-6">
        <Text className="text-2xl mb-2">✅</Text>
        <Text className="text-slate-400 text-sm">Sin vencimientos próximos</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <View className="px-4 py-3 border-b border-slate-100">
        <Text className="text-sm font-semibold text-primary">Próximos vencimientos</Text>
      </View>
      {payments.map((payment) => {
        const isOverdue = payment.daysUntilDue < 0;
        const isUrgent = payment.daysUntilDue <= 2 && !isOverdue;

        return (
          <View
            key={`${payment.type}-${payment.id}`}
            className="flex-row items-center px-4 py-3 border-b border-slate-50"
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{
                backgroundColor: payment.type === 'loan' ? '#EFF6FF' : '#FFF7ED',
              }}
            >
              <Text className="text-base">
                {payment.type === 'loan' ? '🤝' : '💳'}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-800" numberOfLines={1}>
                {payment.name}
              </Text>
              <Text className="text-xs text-slate-400">
                {formatDate(payment.dueDate)}
              </Text>
            </View>

            <View className="items-end gap-1">
              <Text className="text-sm font-semibold text-slate-800">
                {formatCurrency(payment.amount)}
              </Text>
              <View
                className="rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: isOverdue
                    ? '#FEE2E2'
                    : isUrgent
                    ? '#FEF3C7'
                    : '#F0FDF4',
                }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{
                    color: isOverdue ? '#DC2626' : isUrgent ? '#D97706' : '#16A34A',
                  }}
                >
                  {isOverdue
                    ? `Vencido`
                    : payment.daysUntilDue === 0
                    ? 'Hoy'
                    : `${payment.daysUntilDue}d`}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
