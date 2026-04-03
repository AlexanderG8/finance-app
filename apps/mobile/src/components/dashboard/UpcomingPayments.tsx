import { View, Text } from 'react-native';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { UpcomingPayment } from '@/hooks/useUpcomingPayments';

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
}

function Daysbadge({ daysUntilDue }: { daysUntilDue: number }) {
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue <= 2 && !isOverdue;

  return (
    <View
      className="rounded-full px-2 py-0.5 mt-0.5"
      style={{
        backgroundColor: isOverdue ? '#FEE2E2' : isUrgent ? '#FEF3C7' : '#F0FDF4',
      }}
    >
      <Text
        className="text-[10px] font-semibold"
        style={{ color: isOverdue ? '#DC2626' : isUrgent ? '#D97706' : '#16A34A' }}
      >
        {isOverdue ? 'Vencido' : daysUntilDue === 0 ? 'Hoy' : `${daysUntilDue}d`}
      </Text>
    </View>
  );
}

function PaymentRow({ payment, isLast }: { payment: UpcomingPayment; isLast: boolean }) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center mr-3 flex-shrink-0"
        style={{ backgroundColor: payment.type === 'loan' ? '#EFF6FF' : '#FFF7ED' }}
      >
        <Text className="text-base">{payment.type === 'loan' ? '🤝' : '💳'}</Text>
      </View>

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-medium text-slate-800" numberOfLines={1}>
          {payment.name}
        </Text>
        <Text className="text-xs text-slate-400" numberOfLines={1}>
          {payment.subtitle} · {formatDate(payment.dueDate)}
        </Text>
      </View>

      <View className="items-end ml-3 flex-shrink-0">
        <Text className="text-sm font-semibold text-slate-800">
          {formatCurrency(payment.amount)}
        </Text>
        <Daysbadge daysUntilDue={payment.daysUntilDue} />
      </View>
    </View>
  );
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  const loans = payments.filter((p) => p.type === 'loan');
  const debts = payments.filter((p) => p.type === 'debt');

  if (payments.length === 0) {
    return (
      <View className="bg-white rounded-2xl border border-slate-100 items-center py-8">
        <Text className="text-2xl mb-2">✅</Text>
        <Text className="text-slate-400 text-sm">Sin vencimientos próximos</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {/* Cuotas de préstamos */}
      {loans.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="px-4 py-3 border-b border-slate-100 flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-primary">🤝 Cuotas próximas a vencer</Text>
          </View>
          {loans.map((p, i) => (
            <PaymentRow key={p.id} payment={p} isLast={i === loans.length - 1} />
          ))}
        </View>
      )}

      {/* Deudas próximas */}
      {debts.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="px-4 py-3 border-b border-slate-100">
            <Text className="text-sm font-semibold text-primary">💳 Deudas próximas a vencer</Text>
          </View>
          {debts.map((p, i) => (
            <PaymentRow key={p.id} payment={p} isLast={i === debts.length - 1} />
          ))}
        </View>
      )}
    </View>
  );
}
