import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import { useUpcomingPayments } from '@/hooks/useUpcomingPayments';
import { useAIMonthlySummary } from '@/hooks/useAIMonthlySummary';
import { useAIAnomalies } from '@/hooks/useAIAnomalies';
import { StatCard } from '@/components/dashboard/StatCard';
import { BalanceChart } from '@/components/dashboard/BalanceChart';
import { ExpensesPieChart } from '@/components/dashboard/ExpensesPieChart';
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments';
import { formatCurrency } from '@/lib/utils';
import { Colors } from '@/constants/colors';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary } = useDashboard();
  const { payments, isLoading: loadingPayments, fetchPayments } = useUpcomingPayments();
  const { summary: aiSummary, isGenerating: isGeneratingSummary, generate: generateSummary } = useAIMonthlySummary();
  const { anomalies, showAlert: showAnomalyAlert, check: checkAnomalies, dismiss: dismissAnomalies } = useAIAnomalies();

  const loadAll = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchPayments()]);
    checkAnomalies();
  }, [fetchSummary, fetchPayments, checkAnomalies]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshing = isLoading || loadingPayments;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAll}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-primary px-5 pt-4 pb-10">
          <Text className="text-white/70 text-sm">Bienvenido,</Text>
          <Text className="text-white text-xl font-bold">{user?.name ?? 'Usuario'}</Text>
        </View>

        {/* Balance Card */}
        <View className="mx-4 -mt-6 bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <Text className="text-slate-500 text-xs mb-1">Balance del mes</Text>
          {isLoading && !summary ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <>
              <Text
                className="text-3xl font-bold"
                style={{ color: (summary?.balance ?? 0) >= 0 ? Colors.success : Colors.danger }}
              >
                {formatCurrency(summary?.balance ?? 0)}
              </Text>
              {/* Fila 1: entradas */}
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs text-slate-400 mb-0.5">Ingresos</Text>
                  <Text className="text-sm font-semibold text-green-600">
                    +{formatCurrency(summary?.income.total ?? 0)}
                  </Text>
                </View>
                {(summary?.debtReceived.total ?? 0) > 0 && (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 mb-0.5">Deudas recibidas</Text>
                    <Text className="text-sm font-semibold text-indigo-500">
                      +{formatCurrency(summary?.debtReceived.total ?? 0)}
                    </Text>
                  </View>
                )}
                {(summary?.loanCollections.total ?? 0) > 0 && (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 mb-0.5">Cobros</Text>
                    <Text className="text-sm font-semibold text-accent">
                      +{formatCurrency(summary?.loanCollections.total ?? 0)}
                    </Text>
                  </View>
                )}
              </View>
              {/* Fila 2: salidas */}
              <View className="flex-row gap-3 mt-2 pt-2 border-t border-slate-100">
                <View className="flex-1">
                  <Text className="text-xs text-slate-400 mb-0.5">Gastos</Text>
                  <Text className="text-sm font-semibold text-red-500">
                    -{formatCurrency(summary?.expenses.total ?? 0)}
                  </Text>
                </View>
                {(summary?.debtPayments.total ?? 0) > 0 && (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 mb-0.5">Pago deudas</Text>
                    <Text className="text-sm font-semibold text-amber-500">
                      -{formatCurrency(summary?.debtPayments.total ?? 0)}
                    </Text>
                  </View>
                )}
                {(summary?.loanDisbursements.total ?? 0) > 0 && (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-400 mb-0.5">Prestado</Text>
                    <Text className="text-sm font-semibold text-slate-500">
                      -{formatCurrency(summary?.loanDisbursements.total ?? 0)}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View className="px-4 gap-4">
          {/* Stat Cards */}
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              label="Por cobrar"
              value={formatCurrency(summary?.loans.totalPending ?? 0)}
              emoji="🤝"
              color={Colors.accent}
              subtitle={`${summary?.loans.activeLoans ?? 0} préstamos activos`}
            />
            <StatCard
              label="Deuda pendiente"
              value={formatCurrency(summary?.debts.totalPending ?? 0)}
              emoji="💳"
              color={Colors.danger}
            />
            <StatCard
              label="Total ahorrado"
              value={formatCurrency(summary?.savings.totalSaved ?? 0)}
              emoji="🐷"
              color={Colors.success}
              subtitle={`${summary?.savings.goalsCount ?? 0} metas`}
            />
          </View>

          {/* Estado de Préstamos */}
          {summary && (
            <View className="bg-white rounded-2xl p-4 border border-slate-100">
              <Text className="text-sm font-semibold text-primary mb-3">Estado de préstamos</Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-xl font-bold text-accent">{summary.loans.activeLoans}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Activos</Text>
                </View>
                <View className="w-px bg-slate-100" />
                <View className="items-center">
                  <Text className="text-xl font-bold text-green-600">{summary.loans.completedLoans}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Completados</Text>
                </View>
                <View className="w-px bg-slate-100" />
                <View className="items-center">
                  <Text className="text-xl font-bold text-red-500">{summary.loans.overdueLoans}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Vencidos</Text>
                </View>
                <View className="w-px bg-slate-100" />
                <View className="items-center">
                  <Text className="text-sm font-bold text-slate-700">{formatCurrency(summary.loans.totalCollected)}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Cobrado</Text>
                </View>
              </View>
            </View>
          )}

          {/* Balance Chart */}
          {summary && (
            <BalanceChart
              income={summary.income.total}
              expenses={summary.expenses.total}
              debtPayments={summary.debtPayments.total}
            />
          )}

          {/* Expenses Pie Chart */}
          {summary && (
            <ExpensesPieChart categories={summary.expenses.byCategory} />
          )}

          {/* Anomaly Alert */}
          {showAnomalyAlert && (
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-amber-700">⚠️ Gastos inusuales detectados</Text>
                <TouchableOpacity onPress={dismissAnomalies}>
                  <Text className="text-xs text-amber-500">Descartar</Text>
                </TouchableOpacity>
              </View>
              {anomalies.map((a) => (
                <View key={a.categoryName} className="mb-2">
                  <Text className="text-xs font-semibold text-amber-800">{a.categoryName}</Text>
                  <Text className="text-xs text-amber-600">{a.alertMessage}</Text>
                  <Text className="text-xs text-amber-500">
                    +{a.percentageIncrease.toFixed(0)}% vs promedio (S/ {a.averageAmount.toFixed(0)})
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Monthly Summary */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-primary">🤖 Resumen con IA</Text>
            </View>
            {aiSummary ? (
              <>
                <Text className="text-sm text-slate-600 leading-relaxed mb-3">{aiSummary}</Text>
                <TouchableOpacity
                  onPress={() => generateSummary()}
                  disabled={isGeneratingSummary}
                  className="py-2 rounded-xl border border-slate-200 items-center"
                >
                  <Text className="text-xs text-slate-500">
                    {isGeneratingSummary ? 'Generando...' : 'Regenerar resumen'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => generateSummary()}
                disabled={isGeneratingSummary}
                className="py-3 rounded-xl items-center"
                style={{ backgroundColor: isGeneratingSummary ? '#e2e8f0' : Colors.primary }}
              >
                {isGeneratingSummary ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text className="text-slate-500 text-sm">Analizando tus finanzas...</Text>
                  </View>
                ) : (
                  <Text className="text-white text-sm font-semibold">Generar resumen del mes</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Upcoming Payments */}
          <View>
            <Text className="text-sm font-semibold text-primary mb-3">Próximos 7 días</Text>
            <UpcomingPayments payments={payments} />
          </View>

          <View className="h-4" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
