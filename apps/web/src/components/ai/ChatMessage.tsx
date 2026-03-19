'use client';

import type { UIMessage, TextUIPart } from 'ai';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: UIMessage;
}

function getTextFromParts(parts: UIMessage['parts']): string {
  return parts
    .filter((p): p is TextUIPart => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const text = getTextFromParts(message.parts);

  if (!text) return null;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#1E3A5F]' : 'bg-slate-100'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-[#2E86AB]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-[#1E3A5F] text-white'
            : 'rounded-tl-sm bg-slate-100 text-[#1E293B]'
        }`}
      >
        {/* Render preserving line breaks */}
        {text.split('\n').map((line, idx) => (
          <span key={idx}>
            {line}
            {idx < text.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
