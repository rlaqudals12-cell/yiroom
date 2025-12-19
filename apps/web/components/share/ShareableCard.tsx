'use client';

import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShareableCardProps {
  /** 카드 내용 */
  children: ReactNode;
  /** 추가 className */
  className?: string;
  /** 이룸 워터마크 표시 여부 */
  showWatermark?: boolean;
}

/**
 * 공유용 카드 래퍼
 * - 캡처 시 일관된 스타일 보장
 * - 이룸 워터마크 포함 옵션
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  function ShareableCard({ children, className, showWatermark = true }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-card rounded-2xl p-6 shadow-sm',
          className
        )}
        data-testid="shareable-card"
      >
        {children}

        {showWatermark && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">
              이룸에서 분석한 결과입니다
            </span>
            <span className="text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              yiroom.app
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default ShareableCard;
