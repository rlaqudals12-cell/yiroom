/**
 * 키보드 네비게이션 훅
 *
 * 리스트, 갤러리, 탭 등의 키보드 네비게이션을 쉽게 구현
 *
 * WCAG 2.1 AA 준수:
 * - 2.1.1: 키보드 접근성
 * - 2.4.3: 논리적 포커스 순서
 *
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A4
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KEYS,
  type NavigationDirection,
  getFocusableElements,
  setRovingTabIndex,
} from '@/lib/a11y/keyboard-utils';

export interface UseKeyboardNavigationOptions {
  /** 네비게이션 방향 */
  direction?: NavigationDirection;
  /** 순환 네비게이션 */
  wrap?: boolean;
  /** Home/End 키 지원 */
  homeEnd?: boolean;
  /** 자동 포커스 관리 (roving tabindex) */
  autoFocus?: boolean;
  /** 활성 인덱스 변경 콜백 */
  onActiveChange?: (index: number) => void;
  /** 선택 콜백 (Enter/Space) */
  onSelect?: (index: number) => void;
  /** 아이템 개수 (가상 리스트용) */
  itemCount?: number;
  /** 초기 활성 인덱스 */
  initialIndex?: number;
}

export interface UseKeyboardNavigationResult {
  /** 현재 활성 인덱스 */
  activeIndex: number;
  /** 활성 인덱스 설정 */
  setActiveIndex: (index: number) => void;
  /** 컨테이너 ref */
  containerRef: React.RefObject<HTMLElement>;
  /** 컨테이너에 적용할 props */
  containerProps: {
    onKeyDown: (event: React.KeyboardEvent) => void;
    role: string;
  };
  /** 아이템에 적용할 props 생성 함수 */
  getItemProps: (index: number) => {
    tabIndex: number;
    'aria-selected': boolean;
    onFocus: () => void;
    onClick: () => void;
  };
}

/**
 * 키보드 네비게이션 훅
 *
 * @example
 * ```tsx
 * function ColorPalette({ colors, onSelect }) {
 *   const { activeIndex, containerProps, getItemProps } = useKeyboardNavigation({
 *     direction: 'horizontal',
 *     onSelect: (index) => onSelect(colors[index]),
 *   });
 *
 *   return (
 *     <div {...containerProps} ref={containerRef}>
 *       {colors.map((color, index) => (
 *         <button key={color} {...getItemProps(index)}>
 *           {color}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationResult {
  const {
    direction = 'both',
    wrap = true,
    homeEnd = true,
    autoFocus = true,
    onActiveChange,
    onSelect,
    itemCount,
    initialIndex = 0,
  } = options;

  const [activeIndex, setActiveIndexState] = useState(initialIndex);
  const containerRef = useRef<HTMLElement>(null);

  /**
   * 아이템 개수 계산
   */
  const getItemCount = useCallback((): number => {
    if (itemCount !== undefined) {
      return itemCount;
    }
    if (containerRef.current) {
      return getFocusableElements(containerRef.current).length;
    }
    return 0;
  }, [itemCount]);

  /**
   * 활성 인덱스 설정 (범위 검증 포함)
   */
  const setActiveIndex = useCallback(
    (index: number) => {
      const count = getItemCount();
      if (count === 0) return;

      let newIndex = index;

      if (wrap) {
        if (newIndex < 0) newIndex = count - 1;
        if (newIndex >= count) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(count - 1, newIndex));
      }

      setActiveIndexState(newIndex);
      onActiveChange?.(newIndex);
    },
    [getItemCount, wrap, onActiveChange]
  );

  /**
   * 키보드 이벤트 핸들러
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const count = getItemCount();
      if (count === 0) return;

      let handled = false;
      let newIndex = activeIndex;

      // 세로 방향
      if (direction === 'vertical' || direction === 'both') {
        if (event.key === KEYS.ARROW_DOWN) {
          newIndex = activeIndex + 1;
          handled = true;
        } else if (event.key === KEYS.ARROW_UP) {
          newIndex = activeIndex - 1;
          handled = true;
        }
      }

      // 가로 방향
      if (direction === 'horizontal' || direction === 'both') {
        if (event.key === KEYS.ARROW_RIGHT) {
          newIndex = activeIndex + 1;
          handled = true;
        } else if (event.key === KEYS.ARROW_LEFT) {
          newIndex = activeIndex - 1;
          handled = true;
        }
      }

      // Home/End
      if (homeEnd) {
        if (event.key === KEYS.HOME) {
          newIndex = 0;
          handled = true;
        } else if (event.key === KEYS.END) {
          newIndex = count - 1;
          handled = true;
        }
      }

      // Enter/Space - 선택
      if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
        event.preventDefault();
        onSelect?.(activeIndex);
        return;
      }

      if (handled) {
        event.preventDefault();
        setActiveIndex(newIndex);

        // 포커스 이동
        if (autoFocus && containerRef.current) {
          const focusable = getFocusableElements(containerRef.current);
          const targetIndex = wrap
            ? ((newIndex % count) + count) % count
            : Math.max(0, Math.min(count - 1, newIndex));
          focusable[targetIndex]?.focus();
        }
      }
    },
    [
      activeIndex,
      direction,
      homeEnd,
      wrap,
      autoFocus,
      getItemCount,
      setActiveIndex,
      onSelect,
    ]
  );

  /**
   * Roving tabindex 업데이트
   */
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      setRovingTabIndex(containerRef.current, activeIndex);
    }
  }, [activeIndex, autoFocus]);

  /**
   * 아이템 props 생성
   */
  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      'aria-selected': index === activeIndex,
      onFocus: () => setActiveIndex(index),
      onClick: () => {
        setActiveIndex(index);
        onSelect?.(index);
      },
    }),
    [activeIndex, setActiveIndex, onSelect]
  );

  return {
    activeIndex,
    setActiveIndex,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    containerProps: {
      onKeyDown: handleKeyDown,
      role: 'listbox',
    },
    getItemProps,
  };
}

/**
 * 포커스 트랩 훅
 */
export interface UseFocusTrapOptions {
  /** 트랩 활성화 여부 */
  active?: boolean;
  /** Escape 키로 해제 */
  escapeDeactivates?: boolean;
  /** 해제 콜백 */
  onDeactivate?: () => void;
  /** 초기 포커스 요소 선택자 */
  initialFocus?: string;
}

export function useFocusTrap(options: UseFocusTrapOptions = {}) {
  const { active = true, escapeDeactivates = true, onDeactivate, initialFocus } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // 이전 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // 초기 포커스 설정
    const focusInitial = () => {
      if (initialFocus) {
        const element = container.querySelector<HTMLElement>(initialFocus);
        if (element) {
          element.focus();
          return;
        }
      }
      const focusable = getFocusableElements(container);
      focusable[0]?.focus();
    };

    requestAnimationFrame(focusInitial);

    // 키보드 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE && escapeDeactivates) {
        event.preventDefault();
        onDeactivate?.();
        return;
      }

      if (event.key !== KEYS.TAB) return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // 이전 포커스로 복귀
      previousFocusRef.current?.focus();
    };
  }, [active, escapeDeactivates, onDeactivate, initialFocus]);

  return containerRef;
}

export default useKeyboardNavigation;
