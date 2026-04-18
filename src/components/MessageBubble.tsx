import React from 'react';
import type { Message } from '../types';

interface Props { message: Message; }

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={`liya-bubble liya-bubble--${isUser ? 'user' : 'assistant'}`}>
      {message.content}
    </div>
  );
}
