'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

// ============================================
// 타입 정의
// ============================================

export interface UseSwipeTabOptions {
  /** 탭 목록 (순서대로) */
  tabs: string[];
  /** 현재 선택된 탭 */
  activeTab: string;
  /** 탭 변경 콜백 */
  onTabChange: (tab: string) => void;
  /** 스와이프 임계값 (px) - 기본: 50 */
  threshold?: number;
  /** 스와이프 비활성화 */
  disabled?: boolean;
  /** prefers-reduced-motion 존중 */
  respectReducedMotion?: boolean;
}

export interface UseSwipeTabReturn {
  /** 컨테이너에 바인딩할 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 스와이프 중 여부 */
  isSwiping: boolean;
  /** 현재 스와이프 방향 ('left' | 'right' | null) */
  swipeDirection: 'left' | 'right' | null;
  /** 스와이프 진행도 (-1 ~ 1, 음수: 왼쪽, 양수: 오른쪽) */
  swipeProgress: number;
  /** 이전 탭으로 이동 */
  goToPrevious: () => void;
  /** 다음 탭으로 이동 */
  goToNext: () => void;
  /** 터치 이벤트 핸들러 (수동 바인딩용) */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

// ============================================
// 메인 훅
// ============================================

/**
 * 탭 스와이프 네비게이션 훅
 *
 * BeforeAfterSlider의 터치 핸들링 패턴을 재사용하여
 * 탭 간 좌우 스와이프를 지원합니다.
 *
 * @example
 * ```tsx
 * const { containerRef, handlers } = useSwipeTab({
 *   tabs: ['basic', 'evidence', 'visual'],
 *   activeTab,
 *   onTabChange: setActiveTab,
 * });
 *
 * return (
 *   <div ref={containerRef} {...handlers}>
 *     <Tabs value={activeTab} onValueChange={setActiveTab}>
 *       ...
 *     </Tabs>
 *   </div>
 * );
 * ```
 */
export function useSwipeTab({
  tabs,
  activeTab,
  onTabChange,
  threshold = 50,
  disabled = false,
  respectReducedMotion = true,
}: UseSwipeTabOptions): UseSwipeTabReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // prefers-reduced-motion 감지
  useEffect(() => {
    if (!respectReducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectReducedMotion]);

  // 현재 탭 인덱스
  const currentIndex = tabs.indexOf(activeTab);

  // 이전 탭으로 이동
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1]);
    }
  }, [currentIndex, tabs, onTabChange]);

  // 다음 탭으로 이동
  const goToNext = useCallback(() => {
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1]);
    }
  }, [currentIndex, tabs, onTabChange]);

  // 터치 시작
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || prefersReducedMotion) return;

      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      setIsSwiping(true);
      setSwipeDirection(null);
      setSwipeProgress(0);
    },
    [disabled, prefersReducedMotion]
  );

  // 터치 이동
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping || disabled || prefersReducedMotion) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // 수직 스크롤 우선 (Y 이동량이 X보다 크면 스와이프 취소)
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        setIsSwiping(false);
        setSwipeDirection(null);
        setSwipeProgress(0);
        return;
      }

      // 스와이프 방향 및 진행도 계산
      const direction = deltaX > 0 ? 'right' : 'left';
      const progress = Math.min(Math.abs(deltaX) / threshold, 1) * (deltaX > 0 ? 1 : -1);

      setSwipeDirection(direction);
      setSwipeProgress(progress);
    },
    [isSwiping, disabled, prefersReducedMotion, threshold]
  );

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;

    // 스와이프 완료 판정
    if (Math.abs(swipeProgress) >= 1) {
      if (swipeDirection === 'right' && currentIndex > 0) {
        // 오른쪽 스와이프 → 이전 탭
        goToPrevious();
      } else if (swipeDirection === 'left' && currentIndex < tabs.length - 1) {
        // 왼쪽 스와이프 → 다음 탭
        goToNext();
      }
    }

    // 상태 초기화
    setIsSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [isSwiping, swipeProgress, swipeDirection, currentIndex, tabs.length, goToPrevious, goToNext]);

  // 키보드 접근성 (Arrow 키로 탭 전환)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [disabled, goToPrevious, goToNext]);

  return {
    containerRef,
    isSwiping,
    swipeDirection,
    swipeProgress,
    goToPrevious,
    goToNext,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

export default useSwipeTab;
