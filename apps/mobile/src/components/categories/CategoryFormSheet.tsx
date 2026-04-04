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
import { Colors } from '@/constants/colors';
import { Category } from '@/hooks/useCategories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BDC3C7', '#E8A87C',
  '#A8E6CF', '#FFB3BA', '#2E86AB', '#A23B72', '#F18F01',
];

interface CategoryFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; emoji: string; color: string }) => Promise<void>;
  category?: Category | null;
  isSubmitting: boolean;
}

export function CategoryFormSheet({
  visible,
  onClose,
  onSubmit,
  category,
  isSubmitting,
}: CategoryFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]!);

  useEffect(() => {
    if (visible) {
      setName(category?.name ?? '');
      setEmoji(category?.emoji ?? '');
      setColor(category?.color ?? PRESET_COLORS[0]!);
    }
  }, [visible, category]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Validación', 'El nombre es requerido.');
      return;
    }
    if (!emoji.trim()) {
      Alert.alert('Validación', 'El emoji es requerido.');
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      Alert.alert('Validación', 'El color debe ser un hex válido (ej: #FF6B6B).');
      return;
    }
    await onSubmit({ name: name.trim(), emoji: emoji.trim(), color });
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
            {category ? 'Editar categoría' : 'Nueva categoría'}
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
          {/* Preview */}
          <View className="bg-white rounded-2xl border border-slate-100 px-4 py-4 mb-4 flex-row items-center gap-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: color + '30' }}
            >
              <Text className="text-2xl">{emoji || '?'}</Text>
            </View>
            <Text className="text-base font-semibold text-slate-700">
              {name || 'Nombre de categoría'}
            </Text>
          </View>

          {/* Nombre */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">NOMBRE</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: Mascota"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          {/* Emoji */}
          <Text className="text-xs text-slate-500 mb-1 font-medium">EMOJI</Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-4"
            placeholder="Ej: 🐾"
            placeholderTextColor="#94a3b8"
            value={emoji}
            onChangeText={setEmoji}
            maxLength={10}
          />

          {/* Color */}
          <Text className="text-xs text-slate-500 mb-2 font-medium">COLOR</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: Colors.primary,
                }}
              />
            ))}
          </View>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-100 mb-8"
            placeholder="#FF6B6B"
            placeholderTextColor="#94a3b8"
            value={color}
            onChangeText={setColor}
            maxLength={7}
            autoCapitalize="characters"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
