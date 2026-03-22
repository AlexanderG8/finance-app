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
import { Category } from '@/hooks/useCategories';
import { Expense } from '@/hooks/useExpenses';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CREDIT_CARD', label: 'Tarjeta' },
];

const CURRENCIES = ['PEN', 'USD'];

interface ExpenseFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  categories: Category[];
  expense?: Expense | null;
  isSubmitting: boolean;
}

export interface ExpenseFormData {
  categoryId: string;
  description: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  date: string;
  isRecurring: boolean;
  notes: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseFormSheet({
  visible,
  onClose,
  onSubmit,
  categories,
  expense,
  isSubmitting,
}: ExpenseFormSheetProps) {
  const [form, setForm] = useState<ExpenseFormData>({
    categoryId: '',
    description: '',
    amount: '',
    currency: 'PEN',
    paymentMethod: 'CASH',
    date: todayISO(),
    isRecurring: false,
    notes: '',
  });

  useEffect(() => {
    if (expense) {
      setForm({
        categoryId: expense.categoryId,
        description: expense.description,
        amount: String(expense.amount),
        currency: expense.currency,
        paymentMethod: expense.paymentMethod,
        date: expense.date.slice(0, 10),
        isRecurring: expense.isRecurring,
        notes: expense.notes ?? '',
      });
    } else {
      setForm({
        categoryId: categories[0]?.id ?? '',
        description: '',
        amount: '',
        currency: 'PEN',
        paymentMethod: 'CASH',
        date: todayISO(),
        isRecurring: false,
        notes: '',
      });
    }
  }, [expense, visible, categories]);

  function set<K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.categoryId) {
      Alert.alert('Validación', 'Selecciona una categoría');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Validación', 'Ingresa una descripción');
      return;
    }
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido mayor a 0');
      return;
    }
    await onSubmit(form);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">
            {expense ? 'Editar gasto' : 'Nuevo gasto'}
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
          {/* Categoría */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">CATEGORÍA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat) => {
              const selected = form.categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => set('categoryId', cat.id)}
                  className="mr-2 items-center px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: selected ? cat.color + '20' : '#fff',
                    borderColor: selected ? cat.color : '#e2e8f0',
                  }}
                >
                  <Text className="text-xl">{cat.emoji}</Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: selected ? cat.color : '#94a3b8' }}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Descripción */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">DESCRIPCIÓN</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: Almuerzo en restaurante"
            placeholderTextColor="#94a3b8"
            value={form.description}
            onChangeText={(v) => set('description', v)}
          />

          {/* Monto + Moneda */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO</Text>
          <View className="flex-row gap-2 mb-4">
            <TextInput
              className="flex-1 bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(v) => set('amount', v)}
            />
            <View className="flex-row bg-white rounded-xl border border-slate-100 overflow-hidden">
              {CURRENCIES.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  onPress={() => set('currency', cur)}
                  className="px-4 items-center justify-center"
                  style={{ backgroundColor: form.currency === cur ? Colors.primary : '#fff' }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: form.currency === cur ? '#fff' : '#94a3b8' }}
                  >
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
                  <Text
                    className="text-xs font-medium"
                    style={{ color: selected ? '#fff' : '#64748b' }}
                  >
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fecha */}
          <DatePickerField
            label="FECHA"
            value={form.date}
            onChange={(v) => set('date', v)}
          />

          {/* Recurrente */}
          <TouchableOpacity
            onPress={() => set('isRecurring', !form.isRecurring)}
            className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-slate-100 mb-4"
          >
            <View
              className="w-5 h-5 rounded border mr-3 items-center justify-center"
              style={{
                backgroundColor: form.isRecurring ? Colors.primary : '#fff',
                borderColor: form.isRecurring ? Colors.primary : '#cbd5e1',
              }}
            >
              {form.isRecurring && <Text className="text-white text-xs">✓</Text>}
            </View>
            <Text className="text-sm text-slate-700">Gasto recurrente</Text>
          </TouchableOpacity>

          {/* Notas */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOTAS (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-8"
            placeholder="Observaciones adicionales..."
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
