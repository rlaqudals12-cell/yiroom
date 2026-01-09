/**
 * useSwipeTab.ts 테스트
 * @description 탭 스와이프 네비게이션 훅 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeTab } from '@/hooks/useSwipeTab';

// ============================================
// Mock 설정
// ============================================

// matchMedia 모킹
const mockMatchMedia = (matches: boolean = false) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

beforeEach(() => {
  window.matchMedia = mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// 기본 동작 테스트
// ============================================

describe('useSwipeTab', () => {
  const defaultOptions = {
    tabs: ['tab1', 'tab2', 'tab3'],
    activeTab: 'tab1',
    onTabChange: vi.fn(),
  };

  describe('기본 동작', () => {
    it('초기 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBe(null);
      expect(result.current.swipeProgress).toBe(0);
    });

    it('containerRef가 제공되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));
      expect(result.current.containerRef).toBeDefined();
    });

    it('handlers 객체가 제공되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));
      expect(result.current.handlers).toHaveProperty('onTouchStart');
      expect(result.current.handlers).toHaveProperty('onTouchMove');
      expect(result.current.handlers).toHaveProperty('onTouchEnd');
    });
  });

  // ============================================
  // 네비게이션 함수 테스트
  // ============================================

  describe('네비게이션 함수', () => {
    it('goToNext가 다음 탭으로 이동해야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab1', onTabChange })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('goToPrevious가 이전 탭으로 이동해야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab2', onTabChange })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(onTabChange).toHaveBeenCalledWith('tab1');
    });

    it('첫 번째 탭에서 goToPrevious가 동작하지 않아야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab1', onTabChange })
      );

      act(() => {
        result.current.goToPrevious();
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });

    it('마지막 탭에서 goToNext가 동작하지 않아야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab3', onTabChange })
      );

      act(() => {
        result.current.goToNext();
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 터치 이벤트 테스트
  // ============================================

  describe('터치 이벤트', () => {
    it('터치 시작 시 isSwiping이 true가 되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      const touchEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchEvent);
      });

      expect(result.current.isSwiping).toBe(true);
    });

    it('터치 종료 시 isSwiping이 false가 되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(result.current.isSwiping).toBe(false);
    });

    it('왼쪽 스와이프 시 swipeDirection이 left로 설정되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      // 터치 시작
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      // 왼쪽으로 이동
      const touchMoveEvent = {
        touches: [{ clientX: 50, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      expect(result.current.swipeDirection).toBe('left');
    });

    it('오른쪽 스와이프 시 swipeDirection이 right로 설정되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      // 터치 시작
      const touchStartEvent = {
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchStart(touchStartEvent);
      });

      // 오른쪽으로 이동
      const touchMoveEvent = {
        touches: [{ clientX: 150, clientY: 100 }],
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.handlers.onTouchMove(touchMoveEvent);
      });

      expect(result.current.swipeDirection).toBe('right');
    });
  });

  // ============================================
  // 스와이프 완료 테스트
  // ============================================

  describe('스와이프 완료', () => {
    it('임계값 초과 왼쪽 스와이프 시 다음 탭으로 이동해야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab1', onTabChange, threshold: 50 })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 임계값 초과 왼쪽 이동
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 40, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 터치 종료
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('임계값 초과 오른쪽 스와이프 시 이전 탭으로 이동해야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, activeTab: 'tab2', onTabChange, threshold: 50 })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 임계값 초과 오른쪽 이동
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 160, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 터치 종료
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onTabChange).toHaveBeenCalledWith('tab1');
    });

    it('임계값 미만 스와이프 시 탭 변경이 없어야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, onTabChange, threshold: 50 })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 임계값 미만 이동
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 80, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 터치 종료
      act(() => {
        result.current.handlers.onTouchEnd();
      });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 비활성화 테스트
  // ============================================

  describe('비활성화', () => {
    it('disabled=true일 때 터치 이벤트가 무시되어야 함', () => {
      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, onTabChange, disabled: true })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isSwiping).toBe(false);
    });
  });

  // ============================================
  // prefers-reduced-motion 테스트
  // ============================================

  describe('prefers-reduced-motion', () => {
    it('reduced motion 설정 시 스와이프가 비활성화되어야 함', () => {
      window.matchMedia = mockMatchMedia(true);

      const onTabChange = vi.fn();
      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, onTabChange, respectReducedMotion: true })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isSwiping).toBe(false);
    });

    it('respectReducedMotion=false일 때 설정이 무시되어야 함', () => {
      window.matchMedia = mockMatchMedia(true);

      const { result } = renderHook(() =>
        useSwipeTab({ ...defaultOptions, respectReducedMotion: false })
      );

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isSwiping).toBe(true);
    });
  });

  // ============================================
  // 수직 스크롤 우선 테스트
  // ============================================

  describe('수직 스크롤 우선', () => {
    it('수직 이동이 수평보다 크면 스와이프가 취소되어야 함', () => {
      const { result } = renderHook(() => useSwipeTab(defaultOptions));

      // 터치 시작
      act(() => {
        result.current.handlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // 수직 이동이 큰 경우
      act(() => {
        result.current.handlers.onTouchMove({
          touches: [{ clientX: 110, clientY: 200 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBe(null);
    });
  });
});
