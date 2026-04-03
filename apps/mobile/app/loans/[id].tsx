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
import { useLoanDetail, LoanInstallment, useDeleteLoan } from '@/hooks/useLoans';
import { useLoanForm } from '@/hooks/useLoanForm';
import { PayInstallmentSheet, PayInstallmentFormData } from '@/components/loans/PayInstallmentSheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Colors } from '@/constants/colors';

const INSTALLMENT_STATUS = {
  PENDING: { label: 'Pendiente', color: '#F4A261', bg: '#F4A26115' },
  PAID:    { label: 'Pagado',    color: '#28A745', bg: '#28A74515' },
  OVERDUE: { label: 'Vencido',   color: '#E63946', bg: '#E6394615' },
  PARTIAL: { label: 'Parcial',   color: '#2E86AB', bg: '#2E86AB15' },
};

const LOAN_STATUS_LABELS = {
  ACTIVE:    { label: 'Activo',     color: '#2E86AB' },
  COMPLETED: { label: 'Completado', color: '#28A745' },
  OVERDUE:   { label: 'Vencido',    color: '#E63946' },
};

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [paySheet, setPaySheet] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);

  const { loan, isLoading, fetchLoan } = useLoanDetail();
  const { isSubmitting, payInstallment } = useLoanForm();
  const { deleteLoan } = useDeleteLoan();

  const load = useCallback(() => fetchLoan(id), [fetchLoan, id]);

  function handleDeleteLoan() {
    if (!loan) return;
    Alert.alert(
      'Eliminar préstamo',
      `¿Eliminar el préstamo de "${loan.borrowerName}"? Se eliminarán todas las cuotas y pagos. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteLoan(loan.id);
            if (ok) {
              router.replace('/(tabs)/loans' as never);
            } else {
              Alert.alert('Error', 'No se pudo eliminar el préstamo');
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    load();
  }, [load]);

  function handlePay(installment: LoanInstallment) {
    setSelectedInstallment(installment);
    setPaySheet(true);
  }

  async function handlePaySubmit(formData: PayInstallmentFormData) {
    if (!loan || !selectedInstallment) return;
    const ok = await payInstallment(loan.id, selectedInstallment.id, {
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      paidAt: new Date(formData.paidAt).toISOString(),
      notes: formData.notes.trim() || undefined,
    });
    if (ok) {
      setPaySheet(false);
      setSelectedInstallment(null);
      await load();
    } else {
      Alert.alert('Error', 'No se pudo registrar el pago');
    }
  }

  if (isLoading && !loan) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Préstamo no encontrado</Text>
      </SafeAreaView>
    );
  }

  const statusConfig = LOAN_STATUS_LABELS[loan.status];
  const paidInstallments = loan.installments.filter((i) => i.status === 'PAID').length;
  const totalCollected = loan.installments.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = loan.totalAmount - totalCollected;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={loan.installments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="bg-primary px-5 pt-4 pb-10">
              <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-white/70 text-sm">← Préstamos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteLoan} className="px-3 py-1 rounded-full bg-red-500/30">
                  <Text className="text-red-200 text-xs font-semibold">🗑 Eliminar</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">{loan.borrowerName}</Text>
                  {loan.borrowerContact ? (
                    <Text className="text-white/60 text-sm mt-0.5">{loan.borrowerContact}</Text>
                  ) : null}
                </View>
                <View className="px-3 py-1 rounded-full bg-white/20">
                  <Text className="text-white text-xs font-semibold" style={{ color: statusConfig.color === '#28A745' ? '#86efac' : statusConfig.color === '#E63946' ? '#fca5a5' : '#93c5fd' }}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info financiera */}
            <View className="mx-4 -mt-6 bg-white rounded-2xl p-4 border border-slate-100 mb-3">
              <View className="flex-row justify-between mb-3">
                <View>
                  <Text className="text-xs text-slate-400">Principal</Text>
                  <Text className="text-base font-bold text-slate-800">{formatCurrency(loan.principal)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-400">Interés/cuota ({(loan.interestRate * 100).toFixed(0)}%)</Text>
                  <Text className="text-base font-bold text-amber-500">
                    +{formatCurrency(loan.interestAmount)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">Total</Text>
                  <Text className="text-base font-bold text-primary">{formatCurrency(loan.totalAmount)}</Text>
                </View>
              </View>
              <View className="pt-3 border-t border-slate-100 flex-row justify-between">
                <View>
                  <Text className="text-xs text-slate-400">Cobrado</Text>
                  <Text className="text-sm font-semibold text-green-600">{formatCurrency(totalCollected)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-400">Pendiente</Text>
                  <Text className="text-sm font-semibold text-amber-500">{formatCurrency(Math.max(totalPending, 0))}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">Cuota mensual</Text>
                  <Text className="text-sm font-semibold text-slate-700">{formatCurrency(loan.installmentAmount)}</Text>
                </View>
              </View>
              {loan.totalProfit > 0 && (
                <View className="pt-2 mt-2 border-t border-slate-100 flex-row items-center">
                  <Text className="text-xs text-green-600 font-semibold">
                    Ganancia total: {formatCurrency(loan.totalProfit)}
                  </Text>
                </View>
              )}
            </View>

            {/* Progreso */}
            <View className="mx-4 bg-white rounded-2xl p-4 border border-slate-100 mb-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-slate-500">Progreso de cobro</Text>
                <Text className="text-xs font-semibold text-slate-700">
                  {paidInstallments}/{loan.numberOfInstallments} cuotas
                </Text>
              </View>
              <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${loan.numberOfInstallments > 0 ? (paidInstallments / loan.numberOfInstallments) * 100 : 0}%`,
                    backgroundColor: Colors.success,
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-slate-400">Fecha préstamo: {formatDate(loan.loanDate)}</Text>
                <Text className="text-xs text-slate-400">
                  {loan.numberOfInstallments > 0 ? Math.round((paidInstallments / loan.numberOfInstallments) * 100) : 0}% cobrado
                </Text>
              </View>
            </View>

            <Text className="text-sm font-semibold text-primary px-4 mb-2">
              Cronograma de cuotas
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const statusCfg = INSTALLMENT_STATUS[item.status];
          const remaining = item.amount - item.paidAmount;
          const canPay = item.status !== 'PAID';

          return (
            <View className="mx-4 bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2 flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: statusCfg.bg }}
              >
                <Text className="text-xs font-bold" style={{ color: statusCfg.color }}>
                  {item.number}
                </Text>
              </View>

              <View className="flex-1">
                <View className="flex-row justify-between mb-0.5">
                  <Text className="text-xs text-slate-600">Vence: {formatDate(item.dueDate)}</Text>
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: statusCfg.bg }}>
                    <Text className="text-xs font-semibold" style={{ color: statusCfg.color }}>
                      {statusCfg.label}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-slate-400">
                    {formatCurrency(item.paidAmount)} / {formatCurrency(item.amount)}
                  </Text>
                  {canPay && (
                    <TouchableOpacity
                      onPress={() => handlePay(item)}
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: Colors.primary }}
                    >
                      <Text className="text-white text-xs font-semibold">Cobrar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <PayInstallmentSheet
        visible={paySheet}
        onClose={() => { setPaySheet(false); setSelectedInstallment(null); }}
        onSubmit={handlePaySubmit}
        installment={selectedInstallment}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
