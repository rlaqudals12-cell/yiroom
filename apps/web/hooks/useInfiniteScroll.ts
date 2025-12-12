'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  /** 한 번에 로드할 아이템 수 */
  pageSize?: number;
  /** 로드 트리거 거리 (px) */
  threshold?: number;
  /** 초기 로드 아이템 수 */
  initialLoadSize?: number;
}

interface UseInfiniteScrollReturn<T> {
  /** 현재 표시되는 아이템 */
  displayedItems: T[];
  /** 더 로드할 아이템이 있는지 */
  hasMore: boolean;
  /** 로딩 중인지 */
  isLoading: boolean;
  /** 스크롤 감지 ref */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** 수동으로 더 로드 */
  loadMore: () => void;
  /** 리셋 (필터 변경 시) */
  reset: () => void;
}

/**
 * Task 6.5: 무한 스크롤 훅
 * IntersectionObserver를 사용하여 스크롤 끝에 도달하면 더 로드
 */
export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const { pageSize = 6, threshold = 100, initialLoadSize = 6 } = options;

  const [displayCount, setDisplayCount] = useState(initialLoadSize);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    // 약간의 딜레이로 UX 개선
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + pageSize, items.length));
      setIsLoading(false);
    }, 100);
  }, [hasMore, isLoading, pageSize, items.length]);

  const reset = useCallback(() => {
    setDisplayCount(initialLoadSize);
    setIsLoading(false);
  }, [initialLoadSize]);

  // items가 변경되면 리셋
  useEffect(() => {
    reset();
  }, [items.length, reset]);

  // IntersectionObserver로 스크롤 감지
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore, threshold]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    sentinelRef,
    loadMore,
    reset,
  };
}

export default useInfiniteScroll;
