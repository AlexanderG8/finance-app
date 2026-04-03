import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useCategories, useCategoryForm, Category } from '@/hooks/useCategories';
import { CategoryFormSheet } from '@/components/categories/CategoryFormSheet';
import { Colors } from '@/constants/colors';
import { SkeletonList } from '@/components/ui/SkeletonCard';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories, isLoading, fetchCategories } = useCategories();
  const { isSubmitting, createCategory, updateCategory, deleteCategory } = useCategoryForm();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const userCategories = categories.filter((c) => c.isUserCategory);
  const systemCategories = categories.filter((c) => !c.isUserCategory);

  function handleNew() {
    setEditingCategory(null);
    setSheetVisible(true);
  }

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setSheetVisible(true);
  }

  async function handleDelete(cat: Category) {
    Alert.alert(
      'Eliminar categoría',
      `¿Deseas eliminar la categoría ${cat.emoji} ${cat.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteCategory(cat.id);
            if (ok) await loadCategories();
            else Alert.alert('Error', 'No se pudo eliminar la categoría.');
          },
        },
      ]
    );
  }

  async function handleSubmit(data: { name: string; emoji: string; color: string }) {
    let ok = false;
    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, data);
      ok = result !== null;
    } else {
      const result = await createCategory(data);
      ok = result !== null;
    }

    if (ok) {
      setSheetVisible(false);
      setEditingCategory(null);
      await loadCategories();
    } else {
      Alert.alert('Error', editingCategory ? 'No se pudo actualizar.' : 'No se pudo crear la categoría.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-10">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white/70 text-sm">← Atrás</Text>
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Categorías</Text>
          </View>
          <TouchableOpacity
            onPress={handleNew}
            className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
          >
            <Text className="text-white text-xl leading-none">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary card */}
      <View className="mx-4 -mt-6 bg-white rounded-2xl px-5 py-4 border border-slate-100 mb-3">
        <Text className="text-slate-400 text-xs mb-1">Mis categorías</Text>
        {isLoading && categories.length === 0 ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text className="text-2xl font-bold" style={{ color: Colors.primary }}>
            {userCategories.length}
            <Text className="text-sm font-normal text-slate-400"> personalizadas</Text>
          </Text>
        )}
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'sections'}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCategories}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList count={4} />
          ) : (
            <View className="gap-4">
              {/* Mis categorías */}
              <View>
                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Mis categorías ({userCategories.length})
                </Text>
                {userCategories.length === 0 ? (
                  <View className="bg-white rounded-2xl border border-dashed border-slate-200 items-center py-8">
                    <Text className="text-slate-400 text-sm mb-3">Sin categorías personalizadas</Text>
                    <TouchableOpacity
                      onPress={handleNew}
                      className="px-5 py-2 rounded-full"
                      style={{ backgroundColor: Colors.primary }}
                    >
                      <Text className="text-white text-sm font-medium">Crear categoría</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {userCategories.map((cat, index) => (
                      <View
                        key={cat.id}
                        className={`flex-row items-center px-4 py-3 ${index < userCategories.length - 1 ? 'border-b border-slate-50' : ''}`}
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3 flex-shrink-0"
                          style={{ backgroundColor: cat.color + '30' }}
                        >
                          <Text className="text-xl">{cat.emoji}</Text>
                        </View>
                        <Text className="flex-1 text-sm font-medium text-slate-700" numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <View className="flex-row gap-2 flex-shrink-0">
                          <TouchableOpacity
                            onPress={() => handleEdit(cat)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200"
                          >
                            <Text className="text-xs font-medium text-slate-600">Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(cat)}
                            className="px-3 py-1.5 rounded-lg border border-red-200"
                          >
                            <Text className="text-xs font-medium text-red-500">Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Categorías del sistema */}
              <View>
                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Categorías del sistema ({systemCategories.length})
                </Text>
                <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  {systemCategories.map((cat, index) => (
                    <View
                      key={cat.id}
                      className={`flex-row items-center px-4 py-3 opacity-70 ${index < systemCategories.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3 flex-shrink-0"
                        style={{ backgroundColor: cat.color + '30' }}
                      >
                        <Text className="text-xl">{cat.emoji}</Text>
                      </View>
                      <Text className="flex-1 text-sm font-medium text-slate-600" numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-slate-100">
                        <Text className="text-[10px] text-slate-500 font-medium">Sistema</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )
        }
      />

      <CategoryFormSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingCategory(null); }}
        onSubmit={handleSubmit}
        category={editingCategory}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
