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
import { useSavingDetail, GoalStatus } from '@/hooks/useSavings';
import { useSavingForm } from '@/hooks/useSavingForm';
import { useAISavingsAdvice } from '@/hooks/useAISavingsAdvice';
import { ContributeSheet, ContributeFormData } from '@/components/savings/ContributeSheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Colors } from '@/constants/colors';

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: 'En progreso', color: '#2E86AB', bg: '#2E86AB15' },
  COMPLETED:   { label: 'Completada',  color: '#28A745', bg: '#28A74515' },
  PAUSED:      { label: 'Pausada',     color: '#94a3b8', bg: '#94a3b815' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH:          'Efectivo',
  BANK_TRANSFER: 'Transferencia',
};

const STATUS_ACTIONS: { value: GoalStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PAUSED',      label: 'Pausar' },
  { value: 'COMPLETED',   label: 'Completar' },
];

export default function SavingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contributeSheet, setContributeSheet] = useState(false);

  const { goal, projection, isLoading, fetchGoal } = useSavingDetail();
  const { isSubmitting, contribute, updateGoal } = useSavingForm();
  const { advice, isGenerating: isGeneratingAdvice, generate: generateAdvice, reset: resetAdvice } = useAISavingsAdvice();

  const load = useCallback(() => fetchGoal(id), [fetchGoal, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleContribute(formData: ContributeFormData) {
    if (!goal) return;
    const result = await contribute(goal.id, {
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      contributedAt: new Date(formData.contributedAt).toISOString(),
      notes: formData.notes.trim() || undefined,
    });
    if (result) {
      setContributeSheet(false);
      await load();
    } else {
      Alert.alert('Error', 'No se pudo registrar el aporte');
    }
  }

  async function handleStatusChange(status: GoalStatus) {
    if (!goal || goal.status === status) return;
    const result = await updateGoal(goal.id, { status });
    if (result) {
      await load();
    }
  }

  if (isLoading && !goal) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Meta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[goal.status];
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const canContribute = goal.status !== 'COMPLETED';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        data={goal.contributions}
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
                <Text className="text-white/70 text-sm">← Ahorros</Text>
              </TouchableOpacity>
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">{goal.name}</Text>
                  <Text className="text-white/60 text-sm mt-0.5">{goal.currency}</Text>
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
                  <Text className="text-xs text-slate-400">Ahorrado</Text>
                  <Text className="text-base font-bold text-green-600">{formatCurrency(goal.currentAmount)}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-slate-400">Meta</Text>
                  <Text className="text-base font-bold text-primary">{formatCurrency(goal.targetAmount)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">Restante</Text>
                  <Text className="text-base font-bold text-amber-500">{formatCurrency(remaining)}</Text>
                </View>
              </View>

              <View className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? Colors.success : Colors.warning,
                  }}
                />
              </View>
              <Text className="text-xs text-slate-400 text-center">{pct.toFixed(1)}% completado</Text>
            </View>

            {/* Proyección */}
            {projection && !projection.isCompleted && (
              <View className="mx-4 bg-white rounded-2xl p-4 border border-slate-100 mb-3">
                <Text className="text-xs font-semibold text-primary mb-3">Proyección</Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-slate-500">Aporte mensual</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {projection.monthlyContribution ? formatCurrency(projection.monthlyContribution) : '—'}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-slate-500">Meses restantes</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {projection.monthsToComplete != null ? `${projection.monthsToComplete} meses` : '—'}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs text-slate-500">Fecha estimada</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {projection.projectedCompletionDate ? formatDate(projection.projectedCompletionDate) : '—'}
                  </Text>
                </View>
                {projection.isOnTrack !== null && goal.targetDate && (
                  <View className="flex-row justify-between pt-2 border-t border-slate-100">
                    <Text className="text-xs text-slate-500">¿En camino?</Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: projection.isOnTrack ? Colors.success : Colors.danger }}
                    >
                      {projection.isOnTrack ? '✓ Sí, vas bien' : '✗ Necesitas más aportes'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Fechas y estado */}
            {(goal.targetDate || goal.monthlyContribution) && (
              <View className="mx-4 bg-white rounded-2xl px-4 py-3 border border-slate-100 mb-3 flex-row justify-between">
                {goal.targetDate && (
                  <View>
                    <Text className="text-xs text-slate-400">Fecha objetivo</Text>
                    <Text className="text-sm font-semibold text-slate-700">{formatDate(goal.targetDate)}</Text>
                  </View>
                )}
                {goal.monthlyContribution && (
                  <View className="items-end">
                    <Text className="text-xs text-slate-400">Aporte mensual</Text>
                    <Text className="text-sm font-semibold text-slate-700">{formatCurrency(goal.monthlyContribution)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Cambiar estado */}
            <View className="mx-4 mb-3">
              <Text className="text-xs text-slate-500 mb-2 font-medium">ESTADO</Text>
              <View className="flex-row gap-2">
                {STATUS_ACTIONS.map((s) => {
                  const active = goal.status === s.value;
                  return (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => handleStatusChange(s.value)}
                      className="flex-1 py-2 rounded-full border items-center"
                      style={{
                        backgroundColor: active ? Colors.primary : '#fff',
                        borderColor: active ? Colors.primary : '#e2e8f0',
                      }}
                    >
                      <Text className="text-xs font-medium" style={{ color: active ? '#fff' : '#64748b' }}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* IA Savings Advice */}
            <View className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-slate-100">
              <Text className="text-xs font-semibold text-primary mb-2">✨ Asesoría con IA</Text>
              {advice ? (
                <>
                  <View
                    className="rounded-lg px-3 py-2 mb-2"
                    style={{ backgroundColor: advice.isAchievable ? '#28A74515' : '#E6394615' }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: advice.isAchievable ? Colors.success : Colors.danger }}
                    >
                      {advice.isAchievable ? '✓ Meta alcanzable' : '⚠ Requiere ajustes'}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 leading-relaxed mb-2">{advice.assessment}</Text>
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-xs text-slate-400">Aporte recomendado</Text>
                      <Text className="text-sm font-bold text-primary">
                        {formatCurrency(advice.recommendedMonthlyContribution)}/mes
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-slate-400">Fecha estimada</Text>
                      <Text className="text-sm font-bold text-slate-700">
                        {formatDate(advice.estimatedCompletionDate)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs font-semibold text-slate-600 mb-1">Tips:</Text>
                  {advice.tips.map((tip, i) => (
                    <Text key={i} className="text-xs text-slate-500 mb-0.5">• {tip}</Text>
                  ))}
                  <TouchableOpacity
                    onPress={resetAdvice}
                    className="mt-2 py-2 rounded-xl border border-slate-200 items-center"
                  >
                    <Text className="text-xs text-slate-500">Descartar análisis</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => generateAdvice(goal.id)}
                  disabled={isGeneratingAdvice}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: isGeneratingAdvice ? '#e2e8f0' : Colors.accent }}
                >
                  {isGeneratingAdvice ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator color={Colors.primary} size="small" />
                      <Text className="text-slate-500 text-sm">Analizando meta...</Text>
                    </View>
                  ) : (
                    <Text className="text-white text-sm font-semibold">Analizar con IA ✨</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Botón aportar */}
            {canContribute && (
              <View className="mx-4 mb-3">
                <TouchableOpacity
                  onPress={() => setContributeSheet(true)}
                  className="py-3 rounded-xl items-center"
                  style={{ backgroundColor: Colors.success }}
                >
                  <Text className="text-white font-semibold">🐷 Agregar aporte</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-sm font-semibold text-primary px-4 mb-2">
              Historial de aportes {goal.contributions.length > 0 ? `(${goal.contributions.length})` : ''}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-2xl mb-2">📋</Text>
            <Text className="text-slate-400 text-sm">Sin aportes registrados aún</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mx-4 bg-white rounded-xl px-4 py-3 border border-slate-100 mb-2 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-green-600">+{formatCurrency(item.amount)}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod} · {formatDate(item.contributedAt)}
              </Text>
              {item.notes && (
                <Text className="text-xs text-slate-400 mt-0.5">{item.notes}</Text>
              )}
            </View>
          </View>
        )}
      />

      <ContributeSheet
        visible={contributeSheet}
        onClose={() => setContributeSheet(false)}
        onSubmit={handleContribute}
        goal={goal}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
