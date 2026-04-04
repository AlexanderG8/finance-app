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
import { Category } from '@/hooks/useCategories';
import { BudgetComparison } from '@/hooks/useBudgetComparison';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CURRENCIES = ['PEN', 'USD'];

interface BudgetFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => Promise<void>;
  categories: Category[];
  existing?: BudgetComparison | null;
  defaultCategoryId?: string;
  defaultAmount?: string;
  month: number;
  year: number;
  isSubmitting: boolean;
}

export interface BudgetFormData {
  categoryId: string;
  amount: string;
  currency: string;
}

export function BudgetFormSheet({
  visible,
  onClose,
  onSubmit,
  categories,
  existing,
  defaultCategoryId,
  defaultAmount,
  month,
  year,
  isSubmitting,
}: BudgetFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<BudgetFormData>({
    categoryId: '',
    amount: '',
    currency: 'PEN',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        categoryId: existing.budget.categoryId,
        amount: String(existing.budget.amount),
        currency: existing.budget.currency,
      });
    } else {
      setForm({
        categoryId: defaultCategoryId ?? categories[0]?.id ?? '',
        amount: defaultAmount ?? '',
        currency: 'PEN',
      });
    }
  }, [existing, visible, categories, defaultCategoryId, defaultAmount]);

  function set<K extends keyof BudgetFormData>(key: K, value: BudgetFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.categoryId) {
      Alert.alert('Validación', 'Selecciona una categoría');
      return;
    }
    const parsed = parseFloat(form.amount);
    if (!form.amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validación', 'Ingresa un monto válido mayor a 0');
      return;
    }
    await onSubmit(form);
  }

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">
            {existing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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
          {/* Periodo */}
          <View className="bg-white rounded-xl px-4 py-3 border border-slate-100 mb-4 flex-row items-center">
            <Text className="text-sm text-slate-500">Periodo:</Text>
            <Text className="text-sm font-semibold text-primary ml-2">
              {MONTHS[month - 1]} {year}
            </Text>
          </View>

          {/* Categoría */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">CATEGORÍA</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map((cat) => {
              const selected = form.categoryId === cat.id;
              const isDisabled = !!existing && existing.budget.categoryId !== cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => !isDisabled && set('categoryId', cat.id)}
                  className="mr-2 items-center px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: selected ? cat.color + '20' : isDisabled ? '#f8fafc' : '#fff',
                    borderColor: selected ? cat.color : '#e2e8f0',
                    opacity: isDisabled ? 0.4 : 1,
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

          {/* Monto + Moneda */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">MONTO LÍMITE</Text>
          <View className="flex-row gap-2 mb-8">
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
        </ScrollView>
      </View>
    </Modal>
  );
}
