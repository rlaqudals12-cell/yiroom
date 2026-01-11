'use client';

/**
 * Phase D: 채팅 메시지 버블 컴포넌트
 */

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Sparkles, ExternalLink } from 'lucide-react';
import type {
  ChatMessage as ChatMessageType,
  ProductRecommendation,
} from '@/types/skin-consultation';

interface ChatMessageProps {
  message: ChatMessageType;
  onProductClick?: (productId: string) => void;
}

/** 제품 추천 카드 */
function ProductCard({
  product,
  onClick,
}: {
  product: ProductRecommendation;
  onClick?: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
      data-testid="product-card"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* 제품 이미지 placeholder */}
          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{product.brand}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {product.category}
              </Badge>
            </div>
            <p className="font-medium text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{product.reason}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChatMessage({ message, onProductClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
      data-testid="chat-message"
    >
      {/* 아바타 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* 메시지 버블 */}
      <div className={cn('max-w-[80%] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* 제품 추천 (AI 메시지만) */}
        {!isUser && message.productRecommendations && message.productRecommendations.length > 0 && (
          <div className="space-y-2 pl-2">
            {message.productRecommendations.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick?.(product.id)}
              />
            ))}
          </div>
        )}

        {/* 시간 */}
        <span className="text-[10px] text-muted-foreground px-2">
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
