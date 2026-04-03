import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useCreditCards, CreditCard } from '@/hooks/useCreditCards';
import { CreditCardFormSheet } from '@/components/credit-cards/CreditCardFormSheet';
import { CreditCardCycleSummary } from '@/components/credit-cards/CreditCardCycleSummary';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

export default function CreditCardsScreen() {
  const router = useRouter();
  const { cards, isLoading, fetchCards, deleteCard } = useCreditCards();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const loadCards = useCallback(async () => {
    await fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  function handleNew() {
    setEditingCard(null);
    setSheetVisible(true);
  }

  function handleEdit(card: CreditCard) {
    setEditingCard(card);
    setSheetVisible(true);
  }

  async function handleDelete(card: CreditCard) {
    Alert.alert(
      'Eliminar tarjeta',
      `¿Deseas eliminar la tarjeta ${card.entityName}? Los gastos asociados perderán el vínculo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteCard(card.id);
            if (ok) {
              await loadCards();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la tarjeta');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white/70 text-sm">← Atrás</Text>
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Tarjetas de crédito</Text>
          </View>
          <TouchableOpacity
            onPress={handleNew}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCards}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList count={3} />
          ) : (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">💳</Text>
              <Text className="text-slate-400 text-sm">Sin tarjetas registradas</Text>
              <TouchableOpacity
                onPress={handleNew}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white text-sm font-medium">Agregar tarjeta</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            {/* Card header */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-primary">{item.entityName}</Text>
                <Text className="text-xs text-slate-400">
                  Ciclo día {item.cycleStartDay} · Pago día {item.paymentDueDay} · {item.currency}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text className="text-accent text-sm">✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text className="text-red-400 text-sm">🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cycle summary */}
            <CreditCardCycleSummary cardId={item.id} />
          </View>
        )}
      />

      <CreditCardFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingCard(null); }}
        card={editingCard}
        onSuccess={loadCards}
      />
    </SafeAreaView>
  );
}
