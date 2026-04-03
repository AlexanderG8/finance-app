import { View, Text } from 'react-native';
import { ChatMessage } from '@/hooks/useAIChat';
import { Colors } from '@/constants/colors';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`mb-3 max-w-[82%] ${isUser ? 'self-end' : 'self-start'}`}
    >
      {!isUser && (
        <Text className="text-xs text-slate-400 mb-1 ml-1">Asistente IA</Text>
      )}
      <View
        className="rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isUser ? Colors.primary : '#F1F5F9',
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
        }}
      >
        <Text
          className="text-sm leading-relaxed"
          style={{ color: isUser ? '#fff' : '#1e293b' }}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}
