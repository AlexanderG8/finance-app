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
import { SavingGoal } from '@/hooks/useSavings';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/utils';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Solo BANK_TRANSFER y CASH permitidos para ahorros
const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

export interface ContributeFormData {
  amount: string;
  paymentMethod: string;
  contributedAt: string;
  notes: string;
}

interface ContributeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ContributeFormData) => Promise<void>;
  goal: SavingGoal | null;
  isSubmitting: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ContributeSheet({
  visible,
  onClose,
  onSubmit,
  goal,
  isSubmitting,
}: ContributeSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ContributeFormData>({
    amount: '',
    paymentMethod: 'CASH',
    contributedAt: todayISO(),
    notes: '',
  });

  useEffect(() => {
    if (visible) {
      setForm({ amount: '', paymentMethod: 'CASH', contributedAt: todayISO(), notes: '' });
    }
  }, [visible]);

  function set<K extends keyof ContributeFormData>(key: K, value: ContributeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido');
      return;
    }
    await onSubmit(form);
  }

  if (!goal) return null;

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">Agregar aporte</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text className="text-accent text-sm font-semibold">Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {/* Info meta */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
            <Text className="text-xs font-semibold text-primary mb-2">{goal.name}</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Ahorrado</Text>
              <Text className="text-xs font-semibold text-green-600">{formatCurrency(goal.currentAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Meta</Text>
              <Text className="text-xs font-semibold text-primary">{formatCurrency(goal.targetAmount)}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs font-semibold text-slate-700">Restante</Text>
              <Text className="text-xs font-bold text-amber-500">{formatCurrency(remaining)}</Text>
            </View>
          </View>

          {/* Monto */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO DEL APORTE</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={(v) => set('amount', v)}
          />

          {/* Método */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">MÉTODO DE DEPÓSITO</Text>
          <View className="flex-row gap-2 mb-4">
            {PAYMENT_METHODS.map((pm) => {
              const selected = form.paymentMethod === pm.value;
              return (
                <TouchableOpacity
                  key={pm.value}
                  onPress={() => set('paymentMethod', pm.value)}
                  className="flex-1 py-2 rounded-full border items-center"
                  style={{
                    backgroundColor: selected ? Colors.primary : '#fff',
                    borderColor: selected ? Colors.primary : '#e2e8f0',
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: selected ? '#fff' : '#64748b' }}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fecha */}
          <DatePickerField
            label="FECHA DEL APORTE"
            value={form.contributedAt}
            onChange={(v) => set('contributedAt', v)}
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
