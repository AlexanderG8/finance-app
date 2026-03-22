import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/utils';

const menuItems = [
  { label: 'Ingresos', emoji: '💰', available: true, route: '/incomes' },
  { label: 'Asistente IA', emoji: '🤖', available: true, route: '/ai-chat' },
  { label: 'Configuración', emoji: '⚙️', available: true, route: '/settings' },
];

export default function MoreScreen() {
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
          <Text className="text-white text-xl font-bold">Más opciones</Text>
        </View>

        {/* Perfil */}
        <View className="mx-4 -mt-5 bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center gap-3 mb-4">
          <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
            <Text className="text-white font-bold text-base">
              {user ? getInitials(user.name) : 'U'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-800">{user?.name}</Text>
            <Text className="text-xs text-slate-400">{user?.email}</Text>
          </View>
        </View>

        {/* Menú */}
        <View className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              disabled={!item.available}
              onPress={() => item.available && item.route && router.push(item.route as never)}
              className={`flex-row items-center px-4 py-4 ${
                index < menuItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
              activeOpacity={item.available ? 0.7 : 1}
            >
              <Text className="text-2xl mr-3">{item.emoji}</Text>
              <Text
                className="flex-1 text-sm font-medium"
                style={{ color: item.available ? '#1e293b' : '#94a3b8' }}
              >
                {item.label}
              </Text>
              <Text className="text-slate-300 text-base">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View className="mx-4 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-red-600 font-semibold">Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
