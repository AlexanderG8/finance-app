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
import { LoanInstallment } from '@/hooks/useLoans';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDate } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'YAPE',          label: 'Yape' },
  { value: 'PLIN',          label: 'Plin' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

export interface PayInstallmentFormData {
  amount: string;
  paymentMethod: string;
  paidAt: string;
  notes: string;
}

interface PayInstallmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PayInstallmentFormData) => Promise<void>;
  installment: LoanInstallment | null;
  isSubmitting: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PayInstallmentSheet({
  visible,
  onClose,
  onSubmit,
  installment,
  isSubmitting,
}: PayInstallmentSheetProps) {
  const [form, setForm] = useState<PayInstallmentFormData>({
    amount: '',
    paymentMethod: 'CASH',
    paidAt: todayISO(),
    notes: '',
  });

  useEffect(() => {
    if (installment) {
      const remaining = installment.amount - installment.paidAmount;
      setForm({
        amount: remaining > 0 ? String(remaining) : '',
        paymentMethod: 'CASH',
        paidAt: todayISO(),
        notes: '',
      });
    }
  }, [installment, visible]);

  function set<K extends keyof PayInstallmentFormData>(key: K, value: PayInstallmentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido');
      return;
    }
    if (installment) {
      const remaining = installment.amount - installment.paidAmount;
      if (parsed > remaining) {
        Alert.alert('Validación', `El monto no puede superar lo pendiente (${formatCurrency(remaining)})`);
        return;
      }
    }
    await onSubmit(form);
  }

  if (!installment) return null;

  const remaining = installment.amount - installment.paidAmount;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50">
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
          {/* Info cuota */}
          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
            <Text className="text-xs font-semibold text-primary mb-2">Cuota #{installment.number}</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Monto total</Text>
              <Text className="text-xs font-semibold text-slate-700">{formatCurrency(installment.amount)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-slate-500">Ya pagado</Text>
              <Text className="text-xs font-semibold text-green-600">{formatCurrency(installment.paidAmount)}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs font-semibold text-slate-700">Pendiente</Text>
              <Text className="text-xs font-bold text-amber-500">{formatCurrency(remaining)}</Text>
            </View>
            <Text className="text-xs text-slate-400 mt-2">Vence: {formatDate(installment.dueDate)}</Text>
          </View>

          {/* Monto a pagar */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO A PAGAR</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={(v) => set('amount', v)}
          />

          {/* Método de pago */}
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

          {/* Fecha de pago */}
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
