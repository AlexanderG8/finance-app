import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary px-5 pt-4 pb-8">
        <Text className="text-white text-xl font-bold">Mi Perfil</Text>
      </View>

      {/* Avatar */}
      <View className="items-center -mt-8 mb-6">
        <View className="w-16 h-16 rounded-full bg-accent items-center justify-center border-4 border-white">
          <Text className="text-white text-xl font-bold">
            {user ? getInitials(user.name) : 'U'}
          </Text>
        </View>
        <Text className="text-lg font-bold text-primary mt-2">{user?.name}</Text>
        <Text className="text-slate-500 text-sm">{user?.email}</Text>
      </View>

      {/* Info */}
      <View className="mx-4 bg-white rounded-2xl overflow-hidden border border-slate-100">
        <View className="px-5 py-4 border-b border-slate-100">
          <Text className="text-xs text-slate-400 mb-0.5">Moneda preferida</Text>
          <Text className="text-sm font-medium text-slate-700">{user?.preferredCurrency ?? 'PEN'}</Text>
        </View>
        <View className="px-5 py-4">
          <Text className="text-xs text-slate-400 mb-0.5">Zona horaria</Text>
          <Text className="text-sm font-medium text-slate-700">{user?.timezone ?? 'America/Lima'}</Text>
        </View>
      </View>

      {/* Logout */}
      <View className="mx-4 mt-4">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-red-600 font-semibold">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
