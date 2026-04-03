import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { AxiosError } from 'axios';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface SendResult {
  message: string;
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      return 'La respuesta tardó demasiado. Intenta de nuevo en un momento.';
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    if (error.response.status >= 500) {
      return 'El servidor tuvo un problema al procesar tu consulta. Intenta de nuevo en unos segundos.';
    }
    if (error.response.status === 429) {
      return 'Demasiadas consultas en poco tiempo. Espera un momento e intenta de nuevo.';
    }
    const serverMsg = (error.response.data as { error?: string })?.error;
    if (serverMsg) return serverMsg;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: ChatMessage[] }>('/chat/history');
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch {
      // Silently fail — history is optional
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim() || isSending) return false;

    setSendError(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await apiClient.post<{ success: boolean; data: SendResult }>('/ai/chat', { message: text });
      if (res.data.success) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.data.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return true;
      }
      setSendError('No se pudo obtener una respuesta. Intenta de nuevo.');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      return false;
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setSendError(resolveErrorMessage(error));
      return false;
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const clearHistory = useCallback(async (): Promise<boolean> => {
    try {
      await apiClient.delete('/chat/history');
      setMessages([]);
      setSendError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback(() => setSendError(null), []);

  return { messages, isLoading, isSending, sendError, clearError, loadHistory, sendMessage, clearHistory };
}
