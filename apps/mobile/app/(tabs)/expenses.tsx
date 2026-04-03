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
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useBudgetComparison, BudgetComparison } from '@/hooks/useBudgetComparison';
import { useExpenseForm } from '@/hooks/useExpenseForm';
import { useBudgetForm } from '@/hooks/useBudgetForm';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { BudgetProgress } from '@/components/expenses/BudgetProgress';
import { ExpenseFormSheet, ExpenseFormData } from '@/components/expenses/ExpenseFormSheet';
import { BudgetFormSheet, BudgetFormData } from '@/components/expenses/BudgetFormSheet';
import { useAIBudgetRecommendations } from '@/hooks/useAIBudgetRecommendations';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type ActiveTab = 'list' | 'summary' | 'budget';

export default function ExpensesScreen() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const currentYear = now.getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [budgetSheetVisible, setBudgetSheetVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetComparison | null>(null);
  const [defaultBudgetCategoryId, setDefaultBudgetCategoryId] = useState<string | undefined>();
  const [defaultBudgetAmount, setDefaultBudgetAmount] = useState<string | undefined>();
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  const { expenses, pagination, isLoading, fetchExpenses, deleteExpense } = useExpenses();
  const { categories, fetchCategories } = useCategories();
  const { summary, isLoading: loadingSummary, fetchSummary } = useMonthlySummary();
  const { comparisons, isLoading: loadingBudget, fetchComparison } = useBudgetComparison();
  const { isSubmitting, createExpense, updateExpense } = useExpenseForm();
  const { isSubmitting: isSubmittingBudget, upsertBudget, deleteBudget } = useBudgetForm();
  const { recommendations, noDataMessage, isGenerating: isGeneratingAI, generate: generateAI, reset: resetAI } = useAIBudgetRecommendations();

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchExpenses({ month: selectedMonth, year: selectedYear }),
      fetchSummary(selectedMonth, selectedYear),
      fetchComparison(selectedMonth, selectedYear),
    ]);
  }, [fetchExpenses, fetchSummary, fetchComparison, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshing = isLoading || loadingSummary || loadingBudget;

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setSheetVisible(true);
  }

  function handleNew() {
    setEditingExpense(null);
    setSheetVisible(true);
  }

  async function handleDelete(id: string) {
    Alert.alert('Eliminar gasto', '¿Estás seguro de que deseas eliminar este gasto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteExpense(id);
          if (ok) {
            await loadAll();
          } else {
            Alert.alert('Error', 'No se pudo eliminar el gasto');
          }
        },
      },
    ]);
  }

  function handleAddBudget() {
    setEditingBudget(null);
    setDefaultBudgetCategoryId(undefined);
    setDefaultBudgetAmount(undefined);
    setBudgetSheetVisible(true);
  }

  function handleApplyRecommendation(categoryName: string, suggestedAmount: number) {
    const cat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    if (!cat) return;
    setEditingBudget(null);
    setDefaultBudgetCategoryId(cat.id);
    setDefaultBudgetAmount(suggestedAmount.toFixed(2));
    setBudgetSheetVisible(true);
    setAppliedRecommendations((prev) => new Set(prev).add(categoryName));
  }

  function handleEditBudget(item: BudgetComparison) {
    setEditingBudget(item);
    setBudgetSheetVisible(true);
  }

  async function handleDeleteBudget(id: string) {
    Alert.alert('Eliminar presupuesto', '¿Eliminar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteBudget(id);
          if (ok) {
            await fetchComparison(selectedMonth, selectedYear);
          } else {
            Alert.alert('Error', 'No se pudo eliminar el presupuesto');
          }
        },
      },
    ]);
  }

  async function handleBudgetSubmit(formData: BudgetFormData) {
    const ok = await upsertBudget({
      categoryId: formData.categoryId,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      month: selectedMonth,
      year: selectedYear,
    });
    if (ok) {
      setBudgetSheetVisible(false);
      setEditingBudget(null);
      await fetchComparison(selectedMonth, selectedYear);
    } else {
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    }
  }

  async function handleSubmit(formData: ExpenseFormData) {
    const payload = {
      categoryId: formData.categoryId,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      creditCardId: formData.paymentMethod === 'CREDIT_CARD' ? (formData.creditCardId ?? null) : null,
      date: new Date(formData.date).toISOString(),
      isRecurring: formData.isRecurring,
      notes: formData.notes.trim() || undefined,
    };

    let ok = false;
    if (editingExpense) {
      const result = await updateExpense(editingExpense.id, payload);
      ok = result !== null;
    } else {
      const result = await createExpense(payload);
      ok = result !== null;
    }

    if (ok) {
      setSheetVisible(false);
      setEditingExpense(null);
      await loadAll();
    } else {
      Alert.alert('Error', editingExpense ? 'No se pudo actualizar el gasto' : 'No se pudo crear el gasto');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-xl font-bold">Gastos</Text>
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
        <Text className="text-slate-400 text-xs mb-1">Total gastado — {MONTHS[selectedMonth - 1]} {selectedYear}</Text>
        {loadingSummary && !summary ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text className="text-2xl font-bold text-red-500">
            {formatCurrency(summary?.totalAmount ?? 0)}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mb-3 bg-white rounded-xl border border-slate-100 p-1">
        {([
          { key: 'list', label: 'Lista' },
          { key: 'summary', label: 'Resumen' },
          { key: 'budget', label: 'Presupuesto' },
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

      {/* Content */}
      {activeTab === 'list' && (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadAll} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            isLoading ? <SkeletonList count={3} /> : (
              <View className="items-center py-16">
                <Text className="text-3xl mb-2">💸</Text>
                <Text className="text-slate-400 text-sm">Sin gastos en este mes</Text>
                <TouchableOpacity onPress={handleNew} className="mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: Colors.primary }}>
                  <Text className="text-white text-sm font-medium">Agregar gasto</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <Text className="text-center text-xs text-slate-400 mt-2">
                {expenses.length} de {pagination.total} gastos
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <ExpenseCard expense={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        />
      )}

      {activeTab === 'summary' && (
        <FlatList
          data={summary?.byCategory ?? []}
          keyExtractor={(item) => item.category.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadAll} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListHeaderComponent={
            <Text className="text-sm font-semibold text-primary mb-3">
              Gastos por categoría
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
            return (
              <View className="bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-slate-600">
                    {item.category.emoji} {item.category.name}
                  </Text>
                  <View className="flex-row gap-2 items-center">
                    <Text className="text-xs text-slate-400">{pct.toFixed(0)}%</Text>
                    <Text className="text-xs font-semibold text-slate-700">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.category.color }}
                  />
                </View>
                <Text className="text-xs text-slate-400 mt-0.5">{item.count} transacciones</Text>
              </View>
            );
          }}
        />
      )}

      {activeTab === 'budget' && (
        <FlatList
          data={[1]}
          keyExtractor={() => 'budget'}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { loadAll(); resetAI(); setAppliedRecommendations(new Set()); }} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          renderItem={() => (
            loadingBudget && comparisons.length === 0 ? (
              <ActivityIndicator color={Colors.primary} className="mt-8" />
            ) : (
              <>
                <BudgetProgress
                  comparisons={comparisons}
                  onAdd={handleAddBudget}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
                {/* AI Budget Recommendations */}
                <View className="mt-3 bg-white rounded-2xl p-4 border border-slate-100">
                  <Text className="text-sm font-semibold text-primary mb-2">✨ Sugerencias con IA</Text>
                  {recommendations.length > 0 ? (
                    <>
                      {recommendations.map((r) => (
                        <View key={r.categoryName} className="mb-3 pb-3 border-b border-slate-100 last:border-0">
                          <View className="flex-row justify-between items-center mb-0.5">
                            <Text className="text-xs font-semibold text-slate-700 flex-1 mr-2">{r.categoryName}</Text>
                            <Text className="text-xs font-bold text-primary">
                              {formatCurrency(r.suggestedAmount)}
                            </Text>
                          </View>
                          <Text className="text-xs text-slate-400 mb-1.5">{r.reasoning}</Text>
                          {appliedRecommendations.has(r.categoryName) ? (
                            <Text className="text-xs text-green-600 font-medium">Aplicado ✓</Text>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleApplyRecommendation(r.categoryName, r.suggestedAmount)}
                              className="self-start px-3 py-1 rounded-lg border border-slate-200"
                            >
                              <Text className="text-xs font-semibold" style={{ color: Colors.accent }}>Aplicar sugerencia</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => { resetAI(); setAppliedRecommendations(new Set()); }}
                        className="mt-2 py-2 rounded-xl border border-slate-200 items-center"
                      >
                        <Text className="text-xs text-slate-500">Descartar sugerencias</Text>
                      </TouchableOpacity>
                    </>
                  ) : noDataMessage ? (
                    <>
                      <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mb-2">
                        <Text className="text-xs text-amber-700 leading-relaxed">{noDataMessage}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => { resetAI(); }}
                        className="py-2 rounded-xl border border-slate-200 items-center"
                      >
                        <Text className="text-xs text-slate-500">Entendido</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={generateAI}
                      disabled={isGeneratingAI}
                      className="py-3 rounded-xl items-center"
                      style={{ backgroundColor: isGeneratingAI ? '#e2e8f0' : Colors.accent }}
                    >
                      {isGeneratingAI ? (
                        <View className="flex-row items-center gap-2">
                          <ActivityIndicator color={Colors.primary} size="small" />
                          <Text className="text-slate-500 text-sm">Analizando historial...</Text>
                        </View>
                      ) : (
                        <Text className="text-white text-sm font-semibold">Sugerir presupuestos con IA</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )
          )}
        />
      )}

      {/* Expense Form Sheet */}
      <ExpenseFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingExpense(null); }}
        onSubmit={handleSubmit}
        categories={categories}
        expense={editingExpense}
        isSubmitting={isSubmitting}
      />

      {/* Budget Form Sheet */}
      <BudgetFormSheet
        visible={budgetSheetVisible}
        onClose={() => { setBudgetSheetVisible(false); setEditingBudget(null); setDefaultBudgetCategoryId(undefined); setDefaultBudgetAmount(undefined); }}
        onSubmit={handleBudgetSubmit}
        categories={categories}
        existing={editingBudget}
        defaultCategoryId={defaultBudgetCategoryId}
        defaultAmount={defaultBudgetAmount}
        month={selectedMonth}
        year={selectedYear}
        isSubmitting={isSubmittingBudget}
      />
    </SafeAreaView>
  );
}
