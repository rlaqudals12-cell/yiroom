'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EMPTY_STATE_MESSAGES } from '@/lib/messages';

type EmptyStateType = keyof typeof EMPTY_STATE_MESSAGES;

interface EmptyStateProps {
  /** 미리 정의된 타입 사용 */
  type?: EmptyStateType;
  /** 커스텀 제목 */
  title?: string;
  /** 커스텀 설명 */
  description?: string;
  /** 커스텀 CTA 텍스트 */
  ctaText?: string;
  /** CTA 링크 */
  ctaHref?: string;
  /** CTA 클릭 핸들러 */
  onCtaClick?: () => void;
  /** 커스텀 아이콘 */
  icon?: LucideIcon;
  /** 커스텀 이모지 */
  emoji?: string;
  /** 추가 클래스 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 애니메이션 비활성화 */
  noAnimation?: boolean;
}

/**
 * 범용 빈 상태 컴포넌트
 * - 데이터가 없을 때 사용자에게 행동 유도
 * - 격려 메시지로 긍정적 UX 제공
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- component render
export function EmptyState({
  type,
  title,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
  icon: Icon,
  emoji,
  className,
  compact = false,
  noAnimation = false,
}: EmptyStateProps) {
  // 타입이 지정되면 미리 정의된 메시지 사용
  const preset = type ? EMPTY_STATE_MESSAGES[type] : null;

  const displayTitle = title || preset?.title || '데이터가 없어요';
  const displayDescription = description || preset?.description || '첫 번째 기록을 시작해보세요';
  const displayCtaText = ctaText || preset?.cta;
  const displayEmoji = emoji || preset?.emoji || '📝';

  const animationClass = noAnimation ? '' : 'animate-fade-in-up';

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border text-center',
        compact ? 'p-4' : 'p-8',
        'bg-gradient-to-b from-muted/50 to-muted',
        animationClass,
        className
      )}
      data-testid="empty-state"
    >
      {/* 아이콘/이모지 영역 */}
      <div
        className={cn(
          'mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}
      >
        {Icon ? (
          <Icon className={cn('text-primary', compact ? 'w-6 h-6' : 'w-8 h-8')} />
        ) : (
          <span className={compact ? 'text-2xl' : 'text-3xl'}>{displayEmoji}</span>
        )}
      </div>

      {/* 제목 */}
      <h3
        className={cn(
          'font-semibold text-foreground mb-2',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {displayTitle}
      </h3>

      {/* 설명 */}
      <p
        className={cn(
          'text-muted-foreground max-w-sm mx-auto',
          compact ? 'text-sm mb-4' : 'text-base mb-6'
        )}
      >
        {displayDescription}
      </p>

      {/* CTA 버튼 */}
      {displayCtaText && (ctaHref || onCtaClick) && (
        <>
          {ctaHref ? (
            <Link href={ctaHref}>
              <Button
                size={compact ? 'sm' : 'default'}
                className="bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              >
                {displayCtaText}
              </Button>
            </Link>
          ) : (
            <Button
              size={compact ? 'sm' : 'default'}
              onClick={onCtaClick}
              className="bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
            >
              {displayCtaText}
            </Button>
          )}
        </>
      )}

      {/* 격려 메시지 */}
      {!compact && (
        <p className="mt-4 text-xs text-muted-foreground/70">
          작은 시작이 큰 변화를 만들어요 ✨
        </p>
      )}
    </div>
  );
}

export default EmptyState;
