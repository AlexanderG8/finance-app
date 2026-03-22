import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useDebtDetail, DebtStatus } from '@/hooks/useDebts';
import { useDebtForm } from '@/hooks/useDebtForm';
import { PayDebtSheet, PayDebtFormData } from '@/components/debts/PayDebtSheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Colors } from '@/constants/colors';

const STATUS_CONFIG: Record<DebtStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: '#F4A261', bg: '#F4A26115' },
  PARTIAL: { label: 'Parcial',   color: '#2E86AB', bg: '#2E86AB15' },
  PAID:    { label: 'Pagada',    color: '#28A745', bg: '#28A74515' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH:          'Efectivo',
  YAPE:          'Yape',
  PLIN:          'Plin',
  BANK_TRANSFER: 'Transferencia',
};

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [paySheet, setPaySheet] = useState(false);

  const { debt, isLoading, fetchDebt } = useDebtDetail();
  const { isSubmitting, payDebt } = useDebtForm();

  const load = useCallback(() => fetchDebt(id), [fetchDebt, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePaySubmit(formData: PayDebtFormData) {
    if (!debt) return;
    const result = await payDebt(debt.id, {
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      paidAt: new Date(formData.paidAt).toISOString(),
      notes: formData.notes.trim() || undefined,
    });
    if (result) {
      setPaySheet(false);
      await load();
    } else {
      Alert.alert('Error', 'No se pudo registrar el pago');
    }
  }

  if (isLoading && !debt) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!debt) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Deuda no encontrada</Text>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[debt.status];
  const remaining = debt.totalAmount - debt.paidAmount;
  const pct = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
  const canPay = debt.status !== 'PAID';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={debt.payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="bg-primary px-5 pt-4 pb-10">
              <TouchableOpacity onPress={() => router.back()} className="mb-3">
                <Text className="text-white/70 text-sm">← Deudas</Text>
              </TouchableOpacity>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">{debt.creditorName}</Text>
                  {debt.dueDate && (
                    <Text className="text-white/60 text-sm mt-0.5">Vence: {formatDate(debt.dueDate)}</Text>
                  )}
                </View>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: statusConfig.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info financiera */}
            <View className="mx-4 -mt-6 bg-white rounded-2xl p-4 border border-slate-100 mb-3">
              <View className="flex-row justify-between mb-3">
                <View>
                  <Text className="text-xs text-slate-400">Total deuda</Text>
                  <Text className="text-base font-bold text-slate-800">{formatCurrency(debt.totalAmount)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-400">Pagado</Text>
                  <Text className="text-base font-bold text-green-600">{formatCurrency(debt.paidAmount)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">Pendiente</Text>
                  <Text className="text-base font-bold text-red-500">{formatCurrency(remaining)}</Text>
                </View>
              </View>

              {/* Barra de progreso */}
              <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: Colors.success }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400">{pct.toFixed(0)}% pagado</Text>
                {debt.numberOfInstallments && (
                  <Text className="text-xs text-slate-400">{debt.numberOfInstallments} cuotas</Text>
                )}
              </View>
            </View>

            {/* Datos adicionales */}
            <View className="mx-4 bg-white rounded-2xl px-4 py-3 border border-slate-100 mb-3 flex-row justify-between">
              <View>
                <Text className="text-xs text-slate-400">Método habitual</Text>
                <Text className="text-sm font-semibold text-slate-700">
                  {PAYMENT_METHOD_LABELS[debt.paymentMethod] ?? debt.paymentMethod}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-slate-400">Moneda</Text>
                <Text className="text-sm font-semibold text-slate-700">{debt.currency}</Text>
              </View>
            </View>

            {/* Botón pagar */}
            {canPay && (
              <View className="mx-4 mb-3">
                <TouchableOpacity
                  onPress={() => setPaySheet(true)}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: Colors.primary }}
                >
                  <Text className="text-white font-semibold">💳 Registrar pago</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Historial */}
            <Text className="text-sm font-semibold text-primary px-4 mb-2">
              Historial de pagos {debt.payments.length > 0 ? `(${debt.payments.length})` : ''}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-2xl mb-2">📋</Text>
            <Text className="text-slate-400 text-sm">Sin pagos registrados aún</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mx-4 bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-green-600">+{formatCurrency(item.amount)}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod} · {formatDate(item.paidAt)}
              </Text>
              {item.notes && (
                <Text className="text-xs text-slate-400 mt-0.5">{item.notes}</Text>
              )}
            </View>
          </View>
        )}
      />

      <PayDebtSheet
        visible={paySheet}
        onClose={() => setPaySheet(false)}
        onSubmit={handlePaySubmit}
        debt={debt}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
