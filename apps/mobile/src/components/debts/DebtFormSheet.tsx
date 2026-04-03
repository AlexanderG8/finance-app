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

const PAYMENT_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'YAPE',          label: 'Yape' },
  { value: 'PLIN',          label: 'Plin' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

const DEBT_TYPES = [
  { value: 'CASH',   label: 'Efectivo', description: 'Dinero recibido en mano — suma a tu balance' },
  { value: 'CREDIT', label: 'Crédito',  description: 'Compra a crédito — no suma a tu balance' },
];

const CURRENCIES = ['PEN', 'USD'];

export interface DebtFormData {
  creditorName: string;
  totalAmount: string;
  currency: string;
  debtType: string;
  numberOfInstallments: string;
  dueDate: string;
  paymentMethod: string;
  notes: string;
}

interface DebtFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: DebtFormData) => Promise<void>;
  debt?: Debt | null;
  isSubmitting: boolean;
}

export function DebtFormSheet({ visible, onClose, onSubmit, debt, isSubmitting }: DebtFormSheetProps) {
  const [form, setForm] = useState<DebtFormData>({
    creditorName: '',
    totalAmount: '',
    currency: 'PEN',
    debtType: 'CASH',
    numberOfInstallments: '',
    dueDate: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  useEffect(() => {
    if (debt) {
      setForm({
        creditorName: debt.creditorName,
        totalAmount: String(debt.totalAmount),
        currency: debt.currency,
        debtType: debt.debtType,
        numberOfInstallments: debt.numberOfInstallments ? String(debt.numberOfInstallments) : '',
        dueDate: debt.dueDate ? debt.dueDate.slice(0, 10) : '',
        paymentMethod: debt.paymentMethod,
        notes: debt.notes ?? '',
      });
    } else {
      setForm({
        creditorName: '',
        totalAmount: '',
        currency: 'PEN',
        debtType: 'CASH',
        numberOfInstallments: '',
        dueDate: '',
        paymentMethod: 'CASH',
        notes: '',
      });
    }
  }, [debt, visible]);

  function set<K extends keyof DebtFormData>(key: K, value: DebtFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.creditorName.trim()) {
      Alert.alert('Validación', 'Ingresa el nombre del acreedor');
      return;
    }
    const amount = parseFloat(form.totalAmount);
    if (!form.totalAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido mayor a 0');
      return;
    }
    await onSubmit(form);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">
            {debt ? 'Editar deuda' : 'Nueva deuda'}
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
          {/* Acreedor */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">ACREEDOR</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: Banco BCP, Juan Pérez..."
            placeholderTextColor="#94a3b8"
            value={form.creditorName}
            onChangeText={(v) => set('creditorName', v)}
          />

          {/* Monto + Moneda */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO TOTAL</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={form.totalAmount}
              onChangeText={(v) => set('totalAmount', v)}
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

          {/* Tipo de deuda */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">TIPO DE DEUDA</Text>
          <View className="flex-row gap-3 mb-4">
            {DEBT_TYPES.map((dt) => {
              const selected = form.debtType === dt.value;
              return (
                <TouchableOpacity
                  key={dt.value}
                  onPress={() => set('debtType', dt.value)}
                  className="flex-1 rounded-xl border-2 px-3 py-3"
                  style={{
                    borderColor: selected
                      ? dt.value === 'CASH' ? '#28A745' : Colors.accent
                      : '#e2e8f0',
                    backgroundColor: selected
                      ? dt.value === 'CASH' ? '#28A74510' : `${Colors.accent}10`
                      : '#fff',
                  }}
                >
                  <Text className="text-sm font-bold text-slate-800 mb-0.5">{dt.label}</Text>
                  <Text className="text-xs text-slate-400" numberOfLines={2}>{dt.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cuotas */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">N° DE CUOTAS (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: 12"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={form.numberOfInstallments}
            onChangeText={(v) => set('numberOfInstallments', v)}
          />

          {/* Fecha de vencimiento */}
          <DatePickerField
            label="FECHA DE VENCIMIENTO"
            value={form.dueDate}
            onChange={(v) => set('dueDate', v)}
            optional
          />

          {/* Método de pago habitual */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">MÉTODO DE PAGO HABITUAL</Text>
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
