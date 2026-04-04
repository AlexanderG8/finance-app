import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SavingGoal, GoalType } from '@/hooks/useSavings';
import { Colors } from '@/constants/colors';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOAL_TYPES: { value: GoalType; label: string; emoji: string }[] = [
  { value: 'OBJECTIVE', label: 'Objetivo',      emoji: '🎯' },
  { value: 'EMERGENCY', label: 'Emergencia',    emoji: '🆘' },
  { value: 'CUSTOM',    label: 'Personalizado', emoji: '⭐' },
];

const CURRENCIES = ['PEN', 'USD'];

export interface SavingGoalFormData {
  name: string;
  type: GoalType;
  targetAmount: string;
  currency: string;
  targetDate: string;
  monthlyContribution: string;
  notes: string;
}

interface SavingGoalFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SavingGoalFormData) => Promise<void>;
  goal?: SavingGoal | null;
  isSubmitting: boolean;
}

export function SavingGoalFormSheet({
  visible,
  onClose,
  onSubmit,
  goal,
  isSubmitting,
}: SavingGoalFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<SavingGoalFormData>({
    name: '',
    type: 'CUSTOM',
    targetAmount: '',
    currency: 'PEN',
    targetDate: '',
    monthlyContribution: '',
    notes: '',
  });

  useEffect(() => {
    if (goal) {
      setForm({
        name: goal.name,
        type: goal.type,
        targetAmount: String(goal.targetAmount),
        currency: goal.currency,
        targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
        monthlyContribution: goal.monthlyContribution ? String(goal.monthlyContribution) : '',
        notes: goal.notes ?? '',
      });
    } else {
      setForm({
        name: '',
        type: 'CUSTOM',
        targetAmount: '',
        currency: 'PEN',
        targetDate: '',
        monthlyContribution: '',
        notes: '',
      });
    }
  }, [goal, visible]);

  function set<K extends keyof SavingGoalFormData>(key: K, value: SavingGoalFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert('Validación', 'Ingresa el nombre de la meta');
      return;
    }
    const amount = parseFloat(form.targetAmount);
    if (!form.targetAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Validación', 'Ingresa un monto objetivo válido');
      return;
    }
    await onSubmit(form);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">
            {goal ? 'Editar meta' : 'Nueva meta de ahorro'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text className="text-accent text-sm font-semibold">Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {/* Tipo */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">TIPO DE META</Text>
          <View className="flex-row gap-2 mb-4">
            {GOAL_TYPES.map((t) => {
              const selected = form.type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => set('type', t.value)}
                  className="flex-1 items-center py-2 rounded-xl border"
                  style={{
                    backgroundColor: selected ? Colors.primary + '15' : '#fff',
                    borderColor: selected ? Colors.primary : '#e2e8f0',
                  }}
                >
                  <Text className="text-xl mb-0.5">{t.emoji}</Text>
                  <Text className="text-xs" style={{ color: selected ? Colors.primary : '#94a3b8' }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Nombre */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOMBRE DE LA META</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: Viaje a Europa, Fondo de emergencia..."
            placeholderTextColor="#94a3b8"
            value={form.name}
            onChangeText={(v) => set('name', v)}
          />

          {/* Monto objetivo */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO OBJETIVO</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={form.targetAmount}
              onChangeText={(v) => set('targetAmount', v)}
            />
            <View className="flex-row bg-white rounded-xl border border-slate-100 overflow-hidden">
              {CURRENCIES.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  onPress={() => set('currency', cur)}
                  className="px-4 items-center justify-center"
                  style={{ backgroundColor: form.currency === cur ? Colors.primary : '#fff' }}
                >
                  <Text className="text-xs font-semibold" style={{ color: form.currency === cur ? '#fff' : '#94a3b8' }}>
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contribución mensual */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">APORTE MENSUAL (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Cuánto ahorras por mes"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.monthlyContribution}
            onChangeText={(v) => set('monthlyContribution', v)}
          />

          {/* Fecha objetivo */}
          <DatePickerField
            label="FECHA OBJETIVO"
            value={form.targetDate}
            onChange={(v) => set('targetDate', v)}
            optional
          />

          {/* Notas */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOTAS (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-8"
            placeholder="Observaciones..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
