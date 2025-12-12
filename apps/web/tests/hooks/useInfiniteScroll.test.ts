/**
 * Task 6.5: useInfiniteScroll 훅 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

// IntersectionObserver 모킹
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  }));
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useInfiniteScroll', () => {
  const createItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  describe('초기 상태', () => {
    it('initialLoadSize만큼 아이템 표시', () => {
      const items = createItems(20);
      const { result } = renderHook(() =>
        useInfiniteScroll(items, { initialLoadSize: 6 })
      );

      expect(result.current.displayedItems).toHaveLength(6);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('아이템이 initialLoadSize보다 적으면 전체 표시', () => {
      const items = createItems(3);
      const { result } = renderHook(() =>
        useInfiniteScroll(items, { initialLoadSize: 6 })
      );

      expect(result.current.displayedItems).toHaveLength(3);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('loadMore', () => {
    it('pageSize만큼 추가 로드', async () => {
      vi.useFakeTimers();
      const items = createItems(20);
      const { result } = renderHook(() =>
        useInfiniteScroll(items, { pageSize: 6, initialLoadSize: 6 })
      );

      expect(result.current.displayedItems).toHaveLength(6);

      act(() => {
        result.current.loadMore();
      });

      // 로딩 상태 확인
      expect(result.current.isLoading).toBe(true);

      // 타이머 진행
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.displayedItems).toHaveLength(12);
      expect(result.current.isLoading).toBe(false);

      vi.useRealTimers();
    });

    it('더 이상 로드할 아이템이 없으면 hasMore가 false', async () => {
      vi.useFakeTimers();
      const items = createItems(10);
      const { result } = renderHook(() =>
        useInfiniteScroll(items, { pageSize: 6, initialLoadSize: 6 })
      );

      act(() => {
        result.current.loadMore();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.displayedItems).toHaveLength(10);
      expect(result.current.hasMore).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('reset 호출 시 초기 상태로 복귀', async () => {
      vi.useFakeTimers();
      const items = createItems(20);
      const { result } = renderHook(() =>
        useInfiniteScroll(items, { pageSize: 6, initialLoadSize: 6 })
      );

      // 더 로드
      act(() => {
        result.current.loadMore();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.displayedItems).toHaveLength(12);

      // 리셋
      act(() => {
        result.current.reset();
      });

      expect(result.current.displayedItems).toHaveLength(6);
      expect(result.current.hasMore).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('items 변경', () => {
    it('items 배열 길이가 변경되면 자동 리셋', () => {
      const items1 = createItems(20);
      const items2 = createItems(10);

      const { result, rerender } = renderHook(
        ({ items }) => useInfiniteScroll(items, { initialLoadSize: 6 }),
        { initialProps: { items: items1 } }
      );

      expect(result.current.displayedItems).toHaveLength(6);

      // items 변경
      rerender({ items: items2 });

      expect(result.current.displayedItems).toHaveLength(6);
    });
  });

  describe('sentinelRef', () => {
    it('sentinelRef가 정의됨', () => {
      const items = createItems(20);
      const { result } = renderHook(() => useInfiniteScroll(items));

      // sentinelRef가 존재하는지 확인
      expect(result.current.sentinelRef).toBeDefined();
      expect(result.current.sentinelRef.current).toBeNull(); // 초기값은 null
    });
  });
});
