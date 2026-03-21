'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Trash2, Sparkles } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatMessage } from '@/components/ai/ChatMessage';
import { ChatInput } from '@/components/ai/ChatInput';
import { TypingIndicator } from '@/components/ai/TypingIndicator';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

function buildInitialMessages(history: StoredChatMessage[]): UIMessage[] {
  return history.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text' as const, text: m.content }],
    metadata: undefined,
  }));
}

const SUGGESTED_QUESTIONS = [
  '¿Cuánto gasté este mes?',
  '¿En qué categoría gasto más?',
  '¿Estoy en números rojos este mes?',
  '¿Cuánto me falta para mi meta de ahorro?',
  'Dame un resumen de mis finanzas',
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Inner component — receives initialMessages so useChat is stable
function ChatInterface({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { accessToken } = useAuthStore();
  const accessTokenRef = useRef(accessToken);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        headers: () => ({
          Authorization: `Bearer ${accessTokenRef.current ?? ''}`,
        }),
      }),
    [],
  );

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    await sendMessage({ text });
  }

  async function handleClearHistory() {
    if (isClearingHistory) return;
    try {
      setIsClearingHistory(true);
      await apiClient.delete('/chat/history');
      setMessages([]);
    } catch {
      // Ignore
    } finally {
      setIsClearingHistory(false);
    }
  }

  function handleSuggestedQuestion(question: string) {
    if (isLoading) return;
    setInputValue('');
    void sendMessage({ text: question });
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
          <Sparkles className="h-4 w-4 text-[#2E86AB] shrink-0" />
          <span className="truncate hidden sm:inline">Gemini 3.1 Flash Lite Preview · El historial se guarda automáticamente</span>
          <span className="truncate sm:hidden">Historial guardado</span>
        </div>
        {!isEmpty && (
          <button
            onClick={handleClearHistory}
            disabled={isClearingHistory || isLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Nueva conversación
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Empty state with suggested questions */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 pt-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F]">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1E3A5F]">Asistente Financiero</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pregúntame sobre tus gastos, ingresos, deudas o metas de ahorro.
                </p>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs text-slate-600 hover:border-[#2E86AB] hover:text-[#2E86AB] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Bot className="h-4 w-4 text-[#2E86AB]" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-[#E2E8F0] bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isLoading}
          />
          <p className="mt-2 text-center text-xs text-slate-400">
            La IA puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ success: true; data: StoredChatMessage[] }>('/chat/history')
      .then((res) => {
        setInitialMessages(buildInitialMessages(res.data.data));
      })
      .catch(() => {
        setInitialMessages([]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="flex h-screen flex-col"
    >
      <Navbar title="Asistente IA" />

      {isLoadingHistory || initialMessages === null ? (
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      ) : (
        <ChatInterface initialMessages={initialMessages} />
      )}

      {/* Offline placeholder when no API key configured */}
      {!isLoadingHistory && initialMessages !== null && (
        <div className="hidden" aria-hidden />
      )}
    </motion.div>
  );
}
