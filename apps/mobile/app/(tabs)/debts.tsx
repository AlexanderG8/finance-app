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
import { useDebts, Debt, DebtStatus } from '@/hooks/useDebts';
import { useDebtForm } from '@/hooks/useDebtForm';
import { useAIDebtStrategy } from '@/hooks/useAIDebtStrategy';
import { DebtCard } from '@/components/debts/DebtCard';
import { DebtFormSheet, DebtFormData } from '@/components/debts/DebtFormSheet';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

type StatusFilter = 'ALL' | DebtStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL',     label: 'Todas' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'PARTIAL', label: 'Parciales' },
  { key: 'PAID',    label: 'Pagadas' },
];

export default function DebtsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const { debts, isLoading, fetchDebts, deleteDebt } = useDebts();
  const { isSubmitting, createDebt, updateDebt } = useDebtForm();
  const { strategy, isGenerating: isGeneratingStrategy, generate: generateStrategy, reset: resetStrategy } = useAIDebtStrategy();

  const loadDebts = useCallback(async () => {
    await fetchDebts({ status: statusFilter === 'ALL' ? undefined : statusFilter });
  }, [fetchDebts, statusFilter]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // Totales calculados localmente del listado actual
  const totalPending = debts
    .filter((d) => d.status !== 'PAID')
    .reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);

  function handleNew() {
    setEditingDebt(null);
    setSheetVisible(true);
  }

  function handleEdit(debt: Debt) {
    setEditingDebt(debt);
    setSheetVisible(true);
  }

  async function handleDelete(id: string) {
    Alert.alert('Eliminar deuda', '¿Estás seguro de que deseas eliminar esta deuda?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteDebt(id);
          if (!ok) Alert.alert('Error', 'No se pudo eliminar la deuda');
        },
      },
    ]);
  }

  async function handleSubmit(formData: DebtFormData) {
    const installments = formData.numberOfInstallments ? parseInt(formData.numberOfInstallments, 10) : undefined;
    const dueDate = formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined;

    const payload = {
      creditorName: formData.creditorName.trim(),
      totalAmount: parseFloat(formData.totalAmount),
      currency: formData.currency,
      debtType: formData.debtType,
      numberOfInstallments: installments && !isNaN(installments) ? installments : undefined,
      dueDate,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes.trim() || undefined,
    };

    let ok = false;
    if (editingDebt) {
      const result = await updateDebt(editingDebt.id, payload);
      ok = result !== null;
    } else {
      const result = await createDebt(payload);
      ok = result !== null;
    }

    if (ok) {
      setSheetVisible(false);
      setEditingDebt(null);
      await loadDebts();
    } else {
      Alert.alert('Error', editingDebt ? 'No se pudo actualizar la deuda' : 'No se pudo crear la deuda');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">Deudas</Text>
          <TouchableOpacity
            onPress={handleNew}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>

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
      <View className="mx-4 -mt-6 bg-white rounded-2xl px-5 py-4 border border-slate-100 mb-3">
        <Text className="text-slate-400 text-xs mb-1">Deuda pendiente total</Text>
        {isLoading && debts.length === 0 ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text className="text-2xl font-bold text-red-500">{formatCurrency(totalPending)}</Text>
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={debts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadDebts}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? <SkeletonList count={3} /> : (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">💳</Text>
              <Text className="text-slate-400 text-sm">Sin deudas registradas</Text>
              <TouchableOpacity
                onPress={handleNew}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white text-sm font-medium">Agregar deuda</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => (
          <DebtCard debt={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        ListFooterComponent={
          <View className="mx-0 mt-1 mb-2 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-sm font-semibold text-primary mb-2">🧠 Estrategia de pago con IA</Text>
            {strategy ? (
              <>
                <View className="bg-slate-50 rounded-xl p-3 mb-3">
                  <Text className="text-xs font-bold text-slate-700 mb-1">
                    Método: {strategy.recommendedMethod === 'avalanche' ? '📉 Avalancha' : '⛄ Bola de nieve'}
                  </Text>
                  <Text className="text-xs text-slate-600 leading-relaxed">{strategy.methodExplanation}</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-600 mb-1">Orden de pago recomendado:</Text>
                {strategy.debtOrder.map((d, i) => (
                  <View key={d.creditorName} className="flex-row mb-1">
                    <Text className="text-xs text-slate-500 mr-2">{i + 1}.</Text>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-slate-700">{d.creditorName}</Text>
                      <Text className="text-xs text-slate-400">{d.reason}</Text>
                    </View>
                  </View>
                ))}
                <View className="flex-row justify-between mt-3 pt-3 border-t border-slate-100">
                  <View>
                    <Text className="text-xs text-slate-400">Pago mensual sugerido</Text>
                    <Text className="text-sm font-bold text-primary">{formatCurrency(strategy.monthlyTargetAmount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-slate-400">Meses estimados</Text>
                    <Text className="text-sm font-bold text-amber-500">{strategy.estimatedMonthsToDebtFree} meses</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={resetStrategy}
                  className="mt-3 py-2 rounded-xl border border-slate-200 items-center"
                >
                  <Text className="text-xs text-slate-500">Descartar análisis</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={generateStrategy}
                disabled={isGeneratingStrategy}
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: isGeneratingStrategy ? '#e2e8f0' : Colors.primary }}
              >
                {isGeneratingStrategy ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text className="text-slate-500 text-sm">Analizando deudas...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-sm font-semibold">Analizar mis deudas con IA 🧠</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <DebtFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingDebt(null); }}
        onSubmit={handleSubmit}
        debt={editingDebt}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
