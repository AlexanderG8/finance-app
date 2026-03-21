import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoansScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl mb-3">🤝</Text>
        <Text className="text-xl font-bold text-primary mb-1">Préstamos</Text>
        <Text className="text-slate-400 text-sm text-center">Próximamente en Sprint M4</Text>
      </View>
    </SafeAreaView>
  );
}
