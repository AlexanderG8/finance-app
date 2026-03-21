import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary px-5 pt-4 pb-8">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/70 text-sm">Bienvenido,</Text>
              <Text className="text-white text-xl font-bold">{user?.name ?? 'Usuario'}</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white/20 rounded-full px-4 py-2"
              activeOpacity={0.8}
            >
              <Text className="text-white text-xs font-medium">Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View className="mx-4 -mt-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <Text className="text-slate-500 text-sm mb-1">Balance del mes</Text>
          <Text className="text-3xl font-bold text-primary">S/ 0.00</Text>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <Text className="text-xs text-slate-400 mb-0.5">Ingresos</Text>
              <Text className="text-base font-semibold text-green-600">S/ 0.00</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400 mb-0.5">Gastos</Text>
              <Text className="text-base font-semibold text-red-500">S/ 0.00</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mt-6">
          <Text className="text-base font-semibold text-primary mb-3">Accesos rápidos</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: 'Gastos', emoji: '💸', color: 'bg-red-50' },
              { label: 'Ingresos', emoji: '💰', color: 'bg-green-50' },
              { label: 'Préstamos', emoji: '🤝', color: 'bg-blue-50' },
              { label: 'Ahorros', emoji: '🐷', color: 'bg-purple-50' },
            ].map((item) => (
              <View
                key={item.label}
                className={`flex-1 min-w-[40%] ${item.color} rounded-xl p-4 items-center`}
              >
                <Text className="text-3xl mb-1">{item.emoji}</Text>
                <Text className="text-xs font-medium text-slate-600">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Coming Soon */}
        <View className="mx-4 mt-6 mb-8 bg-accent/10 rounded-2xl p-5 items-center">
          <Text className="text-2xl mb-2">🚀</Text>
          <Text className="text-primary font-semibold text-base">Más funciones próximamente</Text>
          <Text className="text-slate-500 text-xs text-center mt-1">
            Estamos desarrollando el resto de módulos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
