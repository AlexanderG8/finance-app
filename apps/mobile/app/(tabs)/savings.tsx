import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useSavings, SavingGoal } from '@/hooks/useSavings';
import { useSavingForm } from '@/hooks/useSavingForm';
import { SavingGoalCard } from '@/components/savings/SavingGoalCard';
import { SavingGoalFormSheet, SavingGoalFormData } from '@/components/savings/SavingGoalFormSheet';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

export default function SavingsScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);

  const { goals, isLoading, fetchGoals, deleteGoal } = useSavings();
  const { isSubmitting, createGoal, updateGoal } = useSavingForm();

  const load = useCallback(() => fetchGoals(), [fetchGoals]);

  useEffect(() => {
    load();
  }, [load]);

  // Totales
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS').length;

  function handleNew() {
    setEditingGoal(null);
    setSheetVisible(true);
  }

  function handleEdit(goal: SavingGoal) {
    setEditingGoal(goal);
    setSheetVisible(true);
  }

  async function handleDelete(id: string) {
    Alert.alert('Eliminar meta', '¿Estás seguro de que deseas eliminar esta meta de ahorro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteGoal(id);
          if (!ok) Alert.alert('Error', 'No se pudo eliminar la meta');
        },
      },
    ]);
  }

  async function handleSubmit(formData: SavingGoalFormData) {
    const targetDate = formData.targetDate
      ? new Date(formData.targetDate).toISOString()
      : undefined;
    const monthlyContribution = formData.monthlyContribution
      ? parseFloat(formData.monthlyContribution)
      : undefined;

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      targetAmount: parseFloat(formData.targetAmount),
      currency: formData.currency,
      targetDate,
      monthlyContribution: monthlyContribution && !isNaN(monthlyContribution) ? monthlyContribution : undefined,
      notes: formData.notes.trim() || undefined,
    };

    let ok = false;
    if (editingGoal) {
      const result = await updateGoal(editingGoal.id, payload);
      ok = result !== null;
    } else {
      const result = await createGoal(payload);
      ok = result !== null;
    }

    if (ok) {
      setSheetVisible(false);
      setEditingGoal(null);
      await load();
    } else {
      Alert.alert('Error', editingGoal ? 'No se pudo actualizar la meta' : 'No se pudo crear la meta');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Ahorros</Text>
          <TouchableOpacity
            onPress={handleNew}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary card */}
      <View className="mx-4 -mt-6 bg-white rounded-2xl px-5 py-4 border border-slate-100 mb-3">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-xs text-slate-400 mb-0.5">Total ahorrado</Text>
            <Text className="text-base font-bold text-green-600">{formatCurrency(totalSaved)}</Text>
          </View>
          <View className="w-px bg-slate-100" />
          <View className="items-center">
            <Text className="text-xs text-slate-400 mb-0.5">Total objetivo</Text>
            <Text className="text-base font-bold text-primary">{formatCurrency(totalTarget)}</Text>
          </View>
          <View className="w-px bg-slate-100" />
          <View className="items-center">
            <Text className="text-xs text-slate-400 mb-0.5">En progreso</Text>
            <Text className="text-base font-bold text-accent">{activeGoals}</Text>
          </View>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? <SkeletonList count={3} /> : (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">🐷</Text>
              <Text className="text-slate-400 text-sm">Sin metas de ahorro</Text>
              <TouchableOpacity
                onPress={handleNew}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white text-sm font-medium">Crear meta</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => (
          <SavingGoalCard goal={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      />

      <SavingGoalFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingGoal(null); }}
        onSubmit={handleSubmit}
        goal={editingGoal}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
