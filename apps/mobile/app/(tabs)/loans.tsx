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
import { useState, useEffect, useCallback } from 'react';
import { useLoans, useLoanSummary, useDeleteLoan, LoanStatus } from '@/hooks/useLoans';
import { useLoanForm } from '@/hooks/useLoanForm';
import { LoanCard } from '@/components/loans/LoanCard';
import { LoanFormSheet, LoanFormData } from '@/components/loans/LoanFormSheet';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

type StatusFilter = 'ALL' | LoanStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL',       label: 'Todos' },
  { key: 'ACTIVE',    label: 'Activos' },
  { key: 'OVERDUE',   label: 'Vencidos' },
  { key: 'COMPLETED', label: 'Completados' },
];

export default function LoansScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sheetVisible, setSheetVisible] = useState(false);

  const { loans, isLoading, fetchLoans } = useLoans();
  const { summary, isLoading: loadingSummary, fetchSummary } = useLoanSummary();
  const { isSubmitting, createLoan } = useLoanForm();
  const { deleteLoan } = useDeleteLoan();

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchLoans({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
      fetchSummary(),
    ]);
  }, [fetchLoans, fetchSummary, statusFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshing = isLoading || loadingSummary;

  async function handleSubmit(formData: LoanFormData) {
    const result = await createLoan({
      borrowerName: formData.borrowerName.trim(),
      borrowerContact: formData.borrowerContact.trim() || undefined,
      principal: parseFloat(formData.principal),
      interestRate: parseFloat(formData.interestRate),
      currency: formData.currency,
      numberOfInstallments: parseInt(formData.numberOfInstallments, 10),
      deliveryMethod: formData.deliveryMethod,
      loanDate: new Date(formData.loanDate).toISOString(),
      notes: formData.notes.trim() || undefined,
    });

    if (result) {
      setSheetVisible(false);
      await loadAll();
    } else {
      Alert.alert('Error', 'No se pudo crear el préstamo. Verifica que tienes saldo suficiente.');
    }
  }

  async function handleDelete(id: string) {
    const ok = await deleteLoan(id);
    if (ok) await loadAll();
    else Alert.alert('Error', 'No se pudo eliminar el préstamo');
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">Préstamos</Text>
          <TouchableOpacity
            onPress={() => setSheetVisible(true)}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de estado */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const selected = statusFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setStatusFilter(item.key)}
                className="mr-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.15)' }}
              >
                <Text className="text-xs font-medium" style={{ color: selected ? Colors.primary : '#fff' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Summary card */}
      <View className="mx-4 -mt-6 bg-white rounded-2xl px-4 py-3 border border-slate-100 mb-3">
        {loadingSummary && !summary ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-xs text-slate-400 mb-0.5">Por cobrar</Text>
              <Text className="text-sm font-bold text-accent">{formatCurrency(summary?.totalPending ?? 0)}</Text>
            </View>
            <View className="w-px bg-slate-100" />
            <View className="items-center">
              <Text className="text-xs text-slate-400 mb-0.5">Cobrado</Text>
              <Text className="text-sm font-bold text-green-600">{formatCurrency(summary?.totalCollected ?? 0)}</Text>
            </View>
            <View className="w-px bg-slate-100" />
            <View className="items-center">
              <Text className="text-xs text-slate-400 mb-0.5">Activos</Text>
              <Text className="text-sm font-bold text-primary">{summary?.activeLoans ?? 0}</Text>
            </View>
            <View className="w-px bg-slate-100" />
            <View className="items-center">
              <Text className="text-xs text-slate-400 mb-0.5">Vencidos</Text>
              <Text className="text-sm font-bold text-red-500">{summary?.overdueLoans ?? 0}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAll} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          isLoading ? <SkeletonList count={3} /> : (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">🤝</Text>
              <Text className="text-slate-400 text-sm">Sin préstamos registrados</Text>
              <TouchableOpacity
                onPress={() => setSheetVisible(true)}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white text-sm font-medium">Crear préstamo</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => <LoanCard loan={item} onDelete={() => handleDelete(item.id)} />}
      />

      <LoanFormSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
