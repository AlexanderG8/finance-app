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
import { useIncomes, Income, IncomeSource } from '@/hooks/useIncomes';
import { useIncomeSummary } from '@/hooks/useIncomeSummary';
import { useIncomeForm } from '@/hooks/useIncomeForm';
import { IncomeCard } from '@/components/incomes/IncomeCard';
import { IncomeFormSheet, IncomeFormData } from '@/components/incomes/IncomeFormSheet';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const SOURCE_LABELS: Record<IncomeSource, string> = {
  SALARY:     '💼 Sueldo',
  FREELANCE:  '💻 Freelance',
  BUSINESS:   '🏪 Negocio',
  INVESTMENT: '📈 Inversión',
  RENTAL:     '🏠 Alquiler',
  OTHER:      '💰 Otro',
};

const SOURCE_COLORS: Record<IncomeSource, string> = {
  SALARY:     '#2E86AB',
  FREELANCE:  '#28A745',
  BUSINESS:   '#F4A261',
  INVESTMENT: '#1E3A5F',
  RENTAL:     '#96CEB4',
  OTHER:      '#BDC3C7',
};

type ActiveTab = 'list' | 'summary';

export default function IncomesScreen() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const currentYear = now.getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const { incomes, pagination, isLoading, fetchIncomes, deleteIncome } = useIncomes();
  const { summary, isLoading: loadingSummary, fetchSummary } = useIncomeSummary();
  const { isSubmitting, createIncome, updateIncome } = useIncomeForm();

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchIncomes({ month: selectedMonth, year: selectedYear }),
      fetchSummary(selectedMonth, selectedYear),
    ]);
  }, [fetchIncomes, fetchSummary, selectedMonth, selectedYear]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshing = isLoading || loadingSummary;

  function handleEdit(income: Income) {
    setEditingIncome(income);
    setSheetVisible(true);
  }

  function handleNew() {
    setEditingIncome(null);
    setSheetVisible(true);
  }

  async function handleDelete(id: string) {
    Alert.alert('Eliminar ingreso', '¿Estás seguro de que deseas eliminar este ingreso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteIncome(id);
          if (ok) {
            await loadAll();
          } else {
            Alert.alert('Error', 'No se pudo eliminar el ingreso');
          }
        },
      },
    ]);
  }

  async function handleSubmit(formData: IncomeFormData) {
    const payload = {
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      source: formData.source,
      paymentMethod: formData.paymentMethod,
      date: new Date(formData.date).toISOString(),
      isRecurring: formData.isRecurring,
      notes: formData.notes.trim() || undefined,
    };

    let ok = false;
    if (editingIncome) {
      const result = await updateIncome(editingIncome.id, payload);
      ok = result !== null;
    } else {
      const result = await createIncome(payload);
      ok = result !== null;
    }

    if (ok) {
      setSheetVisible(false);
      setEditingIncome(null);
      await loadAll();
    } else {
      Alert.alert('Error', editingIncome ? 'No se pudo actualizar el ingreso' : 'No se pudo crear el ingreso');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-xl font-bold">Ingresos</Text>
          <TouchableOpacity
            onPress={handleNew}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>

        {/* Year selector */}
        <View className="flex-row gap-2 mb-2">
          {YEARS.map((year) => {
            const selected = year === selectedYear;
            return (
              <TouchableOpacity
                key={year}
                onPress={() => setSelectedYear(year)}
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.15)' }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: selected ? Colors.primary : '#fff' }}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month selector */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MONTHS}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => {
            const month = index + 1;
            const selected = month === selectedMonth;
            return (
              <TouchableOpacity
                onPress={() => setSelectedMonth(month)}
                className="mr-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: selected ? '#fff' : 'rgba(255,255,255,0.15)' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: selected ? Colors.primary : '#fff' }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Summary card */}
      <View className="mx-4 -mt-6 bg-white rounded-2xl px-5 py-4 border border-slate-100 mb-3">
        <Text className="text-slate-400 text-xs mb-1">
          Total ingresos — {MONTHS[selectedMonth - 1]} {selectedYear}
        </Text>
        {loadingSummary && !summary ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text className="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.totalAmount ?? 0)}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mb-3 bg-white rounded-xl border border-slate-100 p-1">
        {([
          { key: 'list', label: 'Lista' },
          { key: 'summary', label: 'Resumen' },
        ] as { key: ActiveTab; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: activeTab === tab.key ? Colors.primary : 'transparent' }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: activeTab === tab.key ? '#fff' : '#94a3b8' }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {activeTab === 'list' && (
        <FlatList
          data={incomes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadAll}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            isLoading ? <SkeletonList count={3} /> : (
              <View className="items-center py-16">
                <Text className="text-3xl mb-2">💰</Text>
                <Text className="text-slate-400 text-sm">Sin ingresos en este mes</Text>
                <TouchableOpacity
                  onPress={handleNew}
                  className="mt-4 px-6 py-2 rounded-full"
                  style={{ backgroundColor: Colors.primary }}
                >
                  <Text className="text-white text-sm font-medium">Agregar ingreso</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <Text className="text-center text-xs text-slate-400 mt-2">
                {incomes.length} de {pagination.total} ingresos
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <IncomeCard income={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        />
      )}

      {/* Resumen por fuente */}
      {activeTab === 'summary' && (
        <FlatList
          data={summary?.bySource ?? []}
          keyExtractor={(item) => item.source}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadAll}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <Text className="text-sm font-semibold text-primary mb-3">
              Ingresos por fuente
            </Text>
          }
          ListEmptyComponent={
            loadingSummary ? (
              <ActivityIndicator color={Colors.primary} className="mt-8" />
            ) : (
              <View className="items-center py-16">
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-slate-400 text-sm">Sin datos este mes</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const total = summary?.totalAmount ?? 0;
            const pct = total > 0 ? (item.total / total) * 100 : 0;
            const color = SOURCE_COLORS[item.source as IncomeSource] ?? '#BDC3C7';
            return (
              <View className="bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-slate-600">
                    {SOURCE_LABELS[item.source as IncomeSource] ?? item.source}
                  </Text>
                  <View className="flex-row gap-2 items-center">
                    <Text className="text-xs text-slate-400">{pct.toFixed(0)}%</Text>
                    <Text className="text-xs font-semibold text-green-600">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                  />
                </View>
                <Text className="text-xs text-slate-400 mt-0.5">{item.count} registros</Text>
              </View>
            );
          }}
        />
      )}

      {/* Form Sheet */}
      <IncomeFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingIncome(null); }}
        onSubmit={handleSubmit}
        income={editingIncome}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
