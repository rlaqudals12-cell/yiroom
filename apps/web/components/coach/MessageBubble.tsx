'use client';

import { useState, useCallback } from 'react';
import { Sparkles, User, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachMessage } from '@/lib/coach/client';

interface MessageBubbleProps {
  message: CoachMessage;
}

/**
 * 코치 응답이 캡슐에 추가할 수 있는 추천 내용인지 판단
 * 운동, 영양, 스킨케어 관련 구체적 추천이 포함된 경우
 */
function hasActionableRecommendation(content: string): boolean {
  const keywords = [
    '추천',
    '해보세요',
    '시작해보세요',
    '드셔보세요',
    '사용해보세요',
    '루틴',
    '운동',
    '식단',
    '스킨케어',
    '헤어케어',
    '영양제',
  ];
  return keywords.some((kw) => content.includes(kw));
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [addedToCapsule, setAddedToCapsule] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 코치 추천을 캡슐 메모로 저장
  const handleAddToCapsule = useCallback(async () => {
    if (addedToCapsule || isAdding) return;
    setIsAdding(true);

    try {
      // 캡슐 메모로 저장 (Supabase에 코치 추천 기록)
      const response = await fetch('/api/coach/capsule-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          timestamp: message.timestamp,
        }),
      });

      if (response.ok) {
        setAddedToCapsule(true);
      }
    } catch (error) {
      console.error('[Coach] 캡슐 메모 저장 실패:', error);
    } finally {
      setIsAdding(false);
    }
  }, [addedToCapsule, isAdding, message.content, message.timestamp]);

  // 코치 메시지에 추천 내용이 있으면 캡슐 추가 버튼 표시
  const showCapsuleAction = !isUser && hasActionableRecommendation(message.content);

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* 아바타 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary/10' : 'bg-gradient-to-br from-pink-400 to-purple-500'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 메시지 */}
      <div className="max-w-[80%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p
            className={cn(
              'text-xs mt-1',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {formatTime(message.timestamp)}
          </p>
        </div>

        {/* 캡슐에 추가하기 버튼 */}
        {showCapsuleAction && (
          <button
            onClick={handleAddToCapsule}
            disabled={addedToCapsule || isAdding}
            className={cn(
              'flex items-center gap-1 mt-1.5 px-3 py-1 text-xs rounded-full transition-colors',
              addedToCapsule
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50'
            )}
            data-testid="coach-add-to-capsule"
          >
            {addedToCapsule ? (
              <>
                <Check className="w-3 h-3" />
                캡슐에 추가됨
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                {isAdding ? '추가 중...' : '캡슐에 추가하기'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
