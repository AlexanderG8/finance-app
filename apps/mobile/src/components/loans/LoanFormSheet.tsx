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
import { useState } from 'react';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DELIVERY_METHODS = [
  { value: 'CASH',          label: 'Efectivo' },
  { value: 'YAPE',          label: 'Yape' },
  { value: 'PLIN',          label: 'Plin' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
];

const CURRENCIES = ['PEN', 'USD'];

export interface LoanFormData {
  borrowerName: string;
  borrowerContact: string;
  principal: string;
  interestRate: string;
  currency: string;
  numberOfInstallments: string;
  deliveryMethod: string;
  loanDate: string;
  notes: string;
}

interface LoanFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: LoanFormData) => Promise<void>;
  isSubmitting: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcPreview(principal: number, interestRate: number, installments: number) {
  const p = isNaN(principal) || principal <= 0 ? 0 : principal;
  const r = isNaN(interestRate) || interestRate <= 0 ? 0 : interestRate / 100;
  const n = isNaN(installments) || installments <= 0 ? 0 : installments;
  if (p === 0 || n === 0) {
    return { interestAmount: 0, installmentAmount: 0, totalAmount: 0, totalProfit: 0 };
  }
  const interestAmount = Math.round(p * r * 100) / 100;
  const principalPerInstallment = Math.round((p / n) * 100) / 100;
  const installmentAmount = Math.round((principalPerInstallment + interestAmount) * 100) / 100;
  const totalAmount = Math.round(installmentAmount * n * 100) / 100;
  const totalProfit = Math.round(interestAmount * n * 100) / 100;
  return { interestAmount, installmentAmount, totalAmount, totalProfit };
}

export function LoanFormSheet({ visible, onClose, onSubmit, isSubmitting }: LoanFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<LoanFormData>({
    borrowerName: '',
    borrowerContact: '',
    principal: '',
    interestRate: '15',
    currency: 'PEN',
    numberOfInstallments: '',
    deliveryMethod: 'CASH',
    loanDate: todayISO(),
    notes: '',
  });

  function set<K extends keyof LoanFormData>(key: K, value: LoanFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({
      borrowerName: '',
      borrowerContact: '',
      principal: '',
      interestRate: '15',
      currency: 'PEN',
      numberOfInstallments: '',
      deliveryMethod: 'CASH',
      loanDate: todayISO(),
      notes: '',
    });
  }

  const principalNum = parseFloat(form.principal);
  const interestRateNum = parseFloat(form.interestRate);
  const installmentsNum = parseInt(form.numberOfInstallments, 10);
  const preview = calcPreview(principalNum, interestRateNum, installmentsNum);

  async function handleSubmit() {
    if (!form.borrowerName.trim()) {
      Alert.alert('Validación', 'Ingresa el nombre del prestatario');
      return;
    }
    if (!form.principal || isNaN(principalNum) || principalNum <= 0) {
      Alert.alert('Validación', 'Ingresa un monto principal válido');
      return;
    }
    if (!form.interestRate || isNaN(interestRateNum) || interestRateNum <= 0) {
      Alert.alert('Validación', 'Ingresa una tasa de interés válida');
      return;
    }
    if (!form.numberOfInstallments || isNaN(installmentsNum) || installmentsNum < 1) {
      Alert.alert('Validación', 'Ingresa un número de cuotas válido (mínimo 1)');
      return;
    }
    await onSubmit(form);
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={handleClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">Nuevo préstamo</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <Text className="text-accent text-sm font-semibold">Crear</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {/* Preview — siempre visible, se actualiza en tiempo real */}
          <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
            <Text className="text-xs font-semibold text-primary mb-3">Vista previa del préstamo</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-slate-500">Interés por cuota ({interestRateNum || 0}%)</Text>
              <Text className="text-xs font-semibold text-amber-500">{formatCurrency(preview.interestAmount)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-slate-500">Cuota mensual</Text>
              <Text className="text-xs font-bold text-primary">{formatCurrency(preview.installmentAmount)}</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderColor: '#BFDBFE', paddingTop: 8, marginTop: 4 }} className="flex-row justify-between mb-2">
              <Text className="text-xs font-semibold text-slate-700">Total a cobrar</Text>
              <Text className="text-xs font-bold text-slate-700">{formatCurrency(preview.totalAmount)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500">Ganancia total</Text>
              <Text className="text-xs font-bold text-green-600">{formatCurrency(preview.totalProfit)}</Text>
            </View>
          </View>

          {/* Prestatario */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOMBRE DEL PRESTATARIO</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-3"
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#94a3b8"
            value={form.borrowerName}
            onChangeText={(v) => set('borrowerName', v)}
          />

          <Text className="text-xs text-slate-500 mb-1 font-medium">CONTACTO (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Teléfono o email"
            placeholderTextColor="#94a3b8"
            value={form.borrowerContact}
            onChangeText={(v) => set('borrowerContact', v)}
          />

          {/* Monto + moneda */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO PRINCIPAL</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={form.principal}
              onChangeText={(v) => set('principal', v)}
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

          {/* Tasa de interés */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">TASA DE INTERÉS (%)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: 15"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.interestRate}
            onChangeText={(v) => set('interestRate', v)}
          />

          {/* Cuotas */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NÚMERO DE CUOTAS</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: 4"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            value={form.numberOfInstallments}
            onChangeText={(v) => set('numberOfInstallments', v)}
          />

          {/* Método de entrega */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">MÉTODO DE ENTREGA</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {DELIVERY_METHODS.map((pm) => {
              const selected = form.deliveryMethod === pm.value;
              return (
                <TouchableOpacity
                  key={pm.value}
                  onPress={() => set('deliveryMethod', pm.value)}
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
            label="FECHA DEL PRÉSTAMO"
            value={form.loanDate}
            onChange={(v) => set('loanDate', v)}
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
