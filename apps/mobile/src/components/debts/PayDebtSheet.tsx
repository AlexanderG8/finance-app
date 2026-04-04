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
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Debt } from '@/hooks/useDebts';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'YAPE',          label: 'Yape' },
  { value: 'PLIN',          label: 'Plin' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

export interface PayDebtFormData {
  amount: string;
  paymentMethod: string;
  paidAt: string;
  notes: string;
}

interface PayDebtSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PayDebtFormData) => Promise<void>;
  debt: Debt | null;
  isSubmitting: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PayDebtSheet({ visible, onClose, onSubmit, debt, isSubmitting }: PayDebtSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<PayDebtFormData>({
    amount: '',
    paymentMethod: 'CASH',
    paidAt: todayISO(),
    notes: '',
  });

  useEffect(() => {
    if (debt) {
      const remaining = debt.totalAmount - debt.paidAmount;
      setForm({
        amount: remaining > 0 ? String(remaining) : '',
        paymentMethod: debt.paymentMethod,
        paidAt: todayISO(),
        notes: '',
      });
    }
  }, [debt, visible]);

  function set<K extends keyof PayDebtFormData>(key: K, value: PayDebtFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido');
      return;
    }
    if (debt) {
      const remaining = debt.totalAmount - debt.paidAmount;
      if (parsed > remaining) {
        Alert.alert('Validación', `El monto no puede superar lo pendiente (${formatCurrency(remaining)})`);
        return;
      }
    }
    await onSubmit(form);
  }

  if (!debt) return null;

  const remaining = debt.totalAmount - debt.paidAmount;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">Registrar pago</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text className="text-accent text-sm font-semibold">Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {/* Info deuda */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
            <Text className="text-xs font-semibold text-primary mb-2">{debt.creditorName}</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Total deuda</Text>
              <Text className="text-xs font-semibold text-slate-700">{formatCurrency(debt.totalAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Ya pagado</Text>
              <Text className="text-xs font-semibold text-green-600">{formatCurrency(debt.paidAmount)}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs font-semibold text-slate-700">Pendiente</Text>
              <Text className="text-xs font-bold text-red-500">{formatCurrency(remaining)}</Text>
            </View>
          </View>

          {/* Monto */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO A PAGAR</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={(v) => set('amount', v)}
          />

          {/* Método */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">MÉTODO DE PAGO</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {PAYMENT_METHODS.map((pm) => {
              const selected = form.paymentMethod === pm.value;
              return (
                <TouchableOpacity
                  key={pm.value}
                  onPress={() => set('paymentMethod', pm.value)}
                  className="px-4 py-2 rounded-full border"
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
            label="FECHA DE PAGO"
            value={form.paidAt}
            onChange={(v) => set('paidAt', v)}
          />

          {/* Notas */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOTAS (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-8"
            placeholder="Observaciones del pago..."
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
