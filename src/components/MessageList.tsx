import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

interface Props { messages: Message[]; isLoading: boolean; }

export function MessageList({ messages, isLoading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  return (
    <div className="liya-messages">
      {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
      {isLoading && (
        <div className="liya-bubble liya-bubble--assistant">
          <div className="liya-loading-dots"><span /><span /><span /></div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
