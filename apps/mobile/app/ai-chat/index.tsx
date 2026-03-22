import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatBubble } from '@/components/ai/ChatBubble';
import { TypingIndicator } from '@/components/ai/TypingIndicator';
import { Colors } from '@/constants/colors';

const SUGGESTED_QUESTIONS = [
  '¿Cuánto gasté este mes?',
  '¿En qué categoría gasto más?',
  '¿Tengo deudas vencidas?',
  '¿Cómo va mi balance este mes?',
  '¿Cuánto me falta para mi meta de ahorro?',
];

export default function AIChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, isSending, sendError, clearError, loadHistory, sendMessage, clearHistory } = useAIChat();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    await sendMessage(text);
  }

  function handleSuggestedQuestion(q: string) {
    setInput(q);
  }

  async function handleClear() {
    Alert.alert(
      'Nueva conversación',
      '¿Estás seguro de que deseas borrar el historial de chat?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
          },
        },
      ],
    );
  }

  const isEmpty = !isLoading && messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="bg-primary px-5 pt-4 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white/70 text-sm">← Más</Text>
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-bold text-base">Asistente IA</Text>
            <Text className="text-white/60 text-xs">Asesor financiero personal</Text>
          </View>
          <TouchableOpacity onPress={handleClear}>
            <Text className="text-white/70 text-sm">Limpiar</Text>
          </TouchableOpacity>
        </View>

        {/* Messages list */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : isEmpty ? (
          <View className="flex-1 px-5 pt-6">
            <View className="items-center mb-6">
              <Text className="text-4xl mb-2">🤖</Text>
              <Text className="text-base font-semibold text-slate-700 text-center">
                ¡Hola! Soy tu asesor financiero personal.
              </Text>
              <Text className="text-sm text-slate-400 text-center mt-1">
                Pregúntame sobre tus finanzas
              </Text>
            </View>
            <Text className="text-xs text-slate-400 font-medium mb-3">PREGUNTAS SUGERIDAS</Text>
            {SUGGESTED_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleSuggestedQuestion(q)}
                className="bg-white rounded-xl px-4 py-3 mb-2 border border-slate-100"
              >
                <Text className="text-sm text-primary">{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            renderItem={({ item }) => <ChatBubble message={item} />}
            ListFooterComponent={isSending ? <TypingIndicator /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Error banner */}
        {sendError && (
          <View className="mx-4 mb-2 flex-row items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <Text className="text-red-500 text-xs flex-1 leading-relaxed">{sendError}</Text>
            <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-red-400 text-xs font-semibold">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row items-end gap-3">
          <TextInput
            className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 border border-slate-200"
            placeholder="Escribe tu pregunta..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isSending}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{
              backgroundColor: input.trim() && !isSending ? Colors.primary : '#e2e8f0',
            }}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white text-lg">↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
