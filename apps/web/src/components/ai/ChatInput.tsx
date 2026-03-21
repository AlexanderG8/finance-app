'use client';

import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu consulta... (Enter para enviar, Shift+Enter para nueva línea)"
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none bg-transparent text-sm text-[#1E293B] placeholder-slate-400 outline-none disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={isLoading || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1E3A5F] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        aria-label="Enviar mensaje"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
