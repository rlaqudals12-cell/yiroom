'use client';

/**
 * 채팅 메시지 목록 컴포넌트
 */

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ProductRecommendation } from '@/types/chat';
import { ProductCard } from './ProductCard';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지 시 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div data-testid="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">AI 상담에 오신 것을 환영해요!</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            피부, 건강, 운동, 제품에 대해 궁금한 점을 물어보세요.
            <br />
            회원님의 분석 결과를 바탕으로 맞춤 답변을 드릴게요.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <span
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const products = message.metadata?.productRecommendations;

  return (
    <div
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
      data-testid={`message-${message.role}`}
    >
      {/* 아바타 */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>

      {/* 메시지 내용 */}
      <div className={cn('max-w-[80%] space-y-2', isUser && 'text-right')}>
        <div
          className={cn(
            'rounded-lg p-3',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* 제품 추천 카드 */}
        {products && products.length > 0 && (
          <div className="space-y-2">
            {products.map((product: ProductRecommendation) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}

        {/* 시간 */}
        <p className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
