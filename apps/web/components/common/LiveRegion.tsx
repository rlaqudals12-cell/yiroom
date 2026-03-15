'use client';

/**
 * aria-live 래퍼 컴포넌트
 *
 * 동적 콘텐츠 변경 시 스크린리더에 알림을 전달하는 유틸리티 컴포넌트
 * @see WS-3: aria-live 동적 콘텐츠 알림
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  /** 자식 요소 */
  children: ReactNode;
  /** aria-live 속성 (polite: 현재 작업 완료 후, assertive: 즉시) */
  politeness?: 'polite' | 'assertive';
  /** 전체 영역을 다시 읽을지 여부 */
  atomic?: boolean;
  /** 추가 className */
  className?: string;
  /** data-testid */
  testId?: string;
}

// 동적 콘텐츠 변경을 스크린리더에 알림
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
  testId,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn(className)}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

/**
 * 시각적으로 숨겨진 aria-live 영역 (스크린리더 전용 알림)
 */
export function SrOnlyLiveRegion({
  children,
  politeness = 'polite',
}: Pick<LiveRegionProps, 'children' | 'politeness'>) {
  return (
    <div role="status" aria-live={politeness} aria-atomic className="sr-only">
      {children}
    </div>
  );
}
