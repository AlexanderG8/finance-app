import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { storage } from '@/lib/storage';
import { apiClient } from '@/lib/api-client';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
  isRemotePushSupported,
} from '@/hooks/usePushNotifications';
import { Colors } from '@/constants/colors';

export default function SettingsScreen() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();

  // Push
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editCurrency, setEditCurrency] = useState<'PEN' | 'USD'>(user?.preferredCurrency as 'PEN' | 'USD' ?? 'PEN');
  const [isSaving, setIsSaving] = useState(false);

  const loadPushState = useCallback(async () => {
    const enabled = await storage.getPushEnabled();
    setPushEnabled(enabled);
  }, []);

  useEffect(() => {
    loadPushState();
  }, [loadPushState]);

  // Sync edit fields when user changes
  useEffect(() => {
    setEditName(user?.name ?? '');
    setEditCurrency(user?.preferredCurrency as 'PEN' | 'USD' ?? 'PEN');
  }, [user]);

  async function handleSaveProfile() {
    if (!editName.trim() || editName.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await apiClient.put('/auth/profile', {
        name: editName.trim(),
        preferredCurrency: editCurrency,
      });
      setUser(data.data);
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditName(user?.name ?? '');
    setEditCurrency(user?.preferredCurrency as 'PEN' | 'USD' ?? 'PEN');
    setIsEditing(false);
  }

  async function handlePushToggle(value: boolean) {
    setIsTogglingPush(true);
    try {
      if (value) {
        await registerForPushNotifications();
        const actual = await storage.getPushEnabled();
        setPushEnabled(actual);
        if (!actual) {
          Alert.alert(
            'Permisos denegados',
            'Para recibir notificaciones, actívalas desde Ajustes del sistema.',
          );
        }
      } else {
        await unregisterPushNotifications();
        setPushEnabled(false);
      }
    } finally {
      setIsTogglingPush(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary px-5 pt-4 pb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-3">
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>‹ Atrás</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Configuración</Text>
        </View>

        {/* Perfil */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl p-4 border border-slate-100 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold text-slate-400">MI PERFIL</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text className="text-xs font-semibold" style={{ color: Colors.accent }}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Text className="text-xs text-slate-400">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Text className="text-xs font-semibold" style={{ color: Colors.accent }}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-3 mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.accent }}
            >
              <Text className="text-white font-bold text-base">{initials}</Text>
            </View>
            <View className="flex-1">
              {isEditing ? (
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-slate-50"
                  placeholder="Tu nombre"
                  autoFocus
                  maxLength={100}
                />
              ) : (
                <>
                  <Text className="font-semibold text-slate-800 text-sm">{user?.name}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">{user?.email}</Text>
                </>
              )}
            </View>
          </View>

          {/* Moneda preferida */}
          <View>
            <Text className="text-xs text-slate-400 mb-2">Moneda preferida</Text>
            <View className="flex-row gap-2">
              {(['PEN', 'USD'] as const).map((c) => {
                const selected = editCurrency === c;
                const canTap = isEditing;
                return (
                  <TouchableOpacity
                    key={c}
                    disabled={!canTap}
                    onPress={() => setEditCurrency(c)}
                    className="flex-1 py-2 rounded-xl items-center border"
                    style={{
                      backgroundColor: selected ? Colors.primary : '#f8fafc',
                      borderColor: selected ? Colors.primary : '#e2e8f0',
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: selected ? '#fff' : '#64748b' }}
                    >
                      {c === 'PEN' ? '🇵🇪 Soles (PEN)' : '🇺🇸 Dólares (USD)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notificaciones */}
        <View className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
          <View className="px-4 py-3 border-b border-slate-50">
            <Text className="text-xs font-semibold text-slate-400">NOTIFICACIONES</Text>
          </View>

          {isRemotePushSupported ? (
            <>
              <View className="px-4 py-4 flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-sm font-medium text-slate-800">Notificaciones push</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    Alertas de cuotas, presupuestos y metas de ahorro
                  </Text>
                </View>
                {isTogglingPush ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <Switch
                    value={pushEnabled}
                    onValueChange={handlePushToggle}
                    trackColor={{ false: '#e2e8f0', true: Colors.accent }}
                    thumbColor="#fff"
                  />
                )}
              </View>
              <View className="mx-4 mb-3 bg-slate-50 rounded-xl px-3 py-2">
                <Text className="text-xs text-slate-400 leading-relaxed">
                  Recibirás alertas cuando una cuota esté por vencer, hayas usado el 80% de un presupuesto o alcances un hito en tus metas de ahorro.
                </Text>
              </View>
            </>
          ) : (
            <View className="px-4 py-4">
              <Text className="text-sm font-medium text-slate-800 mb-1">Notificaciones push</Text>
              <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-1">
                <Text className="text-xs text-amber-700 leading-relaxed">
                  Las notificaciones push requieren un build de desarrollo o producción. No están disponibles en Expo Go (Android).
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Cerrar sesión */}
        <View className="mx-4 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-red-600 font-semibold text-sm">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
