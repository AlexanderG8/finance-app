import { View, Text } from 'react-native';

export function TypingIndicator() {
  return (
    <View className="self-start mb-3 max-w-[82%]">
      <Text className="text-xs text-slate-400 mb-1 ml-1">Asistente IA</Text>
      <View className="rounded-2xl px-4 py-3 bg-slate-100" style={{ borderBottomLeftRadius: 4 }}>
        <Text className="text-slate-500 text-sm">Escribiendo...</Text>
      </View>
    </View>
  );
}
