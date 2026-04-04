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
import { CreditCard, useCreditCardForm } from '@/hooks/useCreditCards';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CURRENCIES = ['PEN', 'USD'];

export interface CreditCardFormData {
  entityName: string;
  cycleStartDay: string;
  paymentDueDay: string;
  currency: string;
  creditLimit: string;
  notes: string;
}

interface CreditCardFormSheetProps {
  visible: boolean;
  onClose: () => void;
  card?: CreditCard | null;
  onSuccess: () => void;
}

function emptyForm(): CreditCardFormData {
  return {
    entityName: '',
    cycleStartDay: '',
    paymentDueDay: '',
    currency: 'PEN',
    creditLimit: '',
    notes: '',
  };
}

export function CreditCardFormSheet({ visible, onClose, card, onSuccess }: CreditCardFormSheetProps) {
  const insets = useSafeAreaInsets();
  const { isSubmitting, error, createCard, updateCard } = useCreditCardForm();
  const [form, setForm] = useState<CreditCardFormData>(emptyForm());

  useEffect(() => {
    if (card) {
      setForm({
        entityName: card.entityName,
        cycleStartDay: String(card.cycleStartDay),
        paymentDueDay: String(card.paymentDueDay),
        currency: card.currency,
        creditLimit: card.creditLimit ? String(card.creditLimit) : '',
        notes: card.notes ?? '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [card, visible]);

  function set<K extends keyof CreditCardFormData>(key: K, value: CreditCardFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.entityName.trim()) {
      Alert.alert('Validación', 'Ingresa el nombre de la entidad financiera');
      return;
    }
    const cycleStart = parseInt(form.cycleStartDay, 10);
    const paymentDue = parseInt(form.paymentDueDay, 10);
    if (isNaN(cycleStart) || cycleStart < 1 || cycleStart > 28) {
      Alert.alert('Validación', 'El día de inicio del ciclo debe estar entre 1 y 28');
      return;
    }
    if (isNaN(paymentDue) || paymentDue < 1 || paymentDue > 28) {
      Alert.alert('Validación', 'El día límite de pago debe estar entre 1 y 28');
      return;
    }

    const payload = {
      entityName: form.entityName.trim(),
      cycleStartDay: cycleStart,
      paymentDueDay: paymentDue,
      currency: form.currency,
      creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : undefined,
      notes: form.notes.trim() || undefined,
    };

    let result: CreditCard | null = null;
    if (card) {
      result = await updateCard(card.id, payload);
    } else {
      result = await createCard(payload);
    }

    if (result) {
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', error ?? (card ? 'No se pudo actualizar la tarjeta' : 'No se pudo crear la tarjeta'));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-slate-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-accent text-sm">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-primary">
            {card ? 'Editar tarjeta' : 'Nueva tarjeta'}
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
          {/* Entidad financiera */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">ENTIDAD FINANCIERA *</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: BCP, BBVA, Interbank, Scotiabank"
            placeholderTextColor="#94a3b8"
            value={form.entityName}
            onChangeText={(v) => set('entityName', v)}
          />

          {/* Día inicio de ciclo + Día límite de pago */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs text-slate-500 mb-1 font-medium">DÍA INICIO DE CICLO *</Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
                placeholder="Ej: 11"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={form.cycleStartDay}
                onChangeText={(v) => set('cycleStartDay', v)}
              />
              <Text className="text-xs text-slate-400 mt-1">Día del mes (1–28)</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500 mb-1 font-medium">DÍA LÍMITE DE PAGO *</Text>
              <TextInput
                className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100"
                placeholder="Ej: 5"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={form.paymentDueDay}
                onChangeText={(v) => set('paymentDueDay', v)}
              />
              <Text className="text-xs text-slate-400 mt-1">Mes siguiente al cierre</Text>
            </View>
          </View>

          {/* Moneda */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">MONEDA</Text>
          <View className="flex-row bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur}
                onPress={() => set('currency', cur)}
                className="flex-1 py-3 items-center"
                style={{ backgroundColor: form.currency === cur ? Colors.primary : '#fff' }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: form.currency === cur ? '#fff' : '#94a3b8' }}
                >
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Límite de crédito */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">LÍMITE DE CRÉDITO (OPCIONAL)</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={form.creditLimit}
            onChangeText={(v) => set('creditLimit', v)}
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
