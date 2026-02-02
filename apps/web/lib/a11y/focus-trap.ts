/**
 * 포커스 트랩 유틸리티
 *
 * 모달, 다이얼로그 등에서 포커스가 컨테이너 내에 머무르도록 함
 *
 * WCAG 2.1 AA 준수:
 * - 2.1.2: 키보드 트랩 방지 (Escape로 해제 가능)
 * - 2.4.3: 논리적 포커스 순서
 *
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A4
 */

import { KEYS, getFocusableElements, focusFirst } from './keyboard-utils';

/**
 * 포커스 트랩 옵션
 */
export interface FocusTrapOptions {
  /** Escape 키로 트랩 해제 */
  escapeDeactivates?: boolean;
  /** 트랩 해제 콜백 */
  onDeactivate?: () => void;
  /** 초기 포커스 요소 선택자 또는 요소 */
  initialFocus?: string | HTMLElement | null;
  /** 트랩 해제 후 포커스할 요소 */
  returnFocus?: HTMLElement | null;
  /** 컨테이너 외부 클릭 시 해제 */
  clickOutsideDeactivates?: boolean;
}

/**
 * 포커스 트랩 인스턴스
 */
export interface FocusTrap {
  /** 트랩 활성화 */
  activate: () => void;
  /** 트랩 비활성화 */
  deactivate: () => void;
  /** 트랩 활성 상태 */
  isActive: () => boolean;
  /** 트랩 일시정지 */
  pause: () => void;
  /** 트랩 재개 */
  unpause: () => void;
}

/**
 * 포커스 트랩 생성
 *
 * @example
 * ```tsx
 * const trap = createFocusTrap(modalRef.current, {
 *   escapeDeactivates: true,
 *   onDeactivate: () => setIsOpen(false),
 * });
 *
 * // 모달 열 때
 * trap.activate();
 *
 * // 모달 닫을 때
 * trap.deactivate();
 * ```
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): FocusTrap {
  const {
    escapeDeactivates = true,
    onDeactivate,
    initialFocus = null,
    returnFocus = null,
    clickOutsideDeactivates = false,
  } = options;

  let active = false;
  let paused = false;
  let previouslyFocused: HTMLElement | null = null;

  /**
   * Tab 키 처리 - 포커스 순환
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (paused || !active) return;

    // Escape 키로 해제
    if (event.key === KEYS.ESCAPE && escapeDeactivates) {
      event.preventDefault();
      deactivate();
      return;
    }

    // Tab 키 처리
    if (event.key !== KEYS.TAB) return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    // Shift+Tab: 첫 번째 요소에서 마지막으로
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab: 마지막 요소에서 첫 번째로
    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * 컨테이너 외부 클릭 처리
   */
  function handleClickOutside(event: MouseEvent): void {
    if (paused || !active || !clickOutsideDeactivates) return;

    const target = event.target as Node;
    if (!container.contains(target)) {
      deactivate();
    }
  }

  /**
   * 포커스 이탈 방지
   */
  function handleFocusOut(event: FocusEvent): void {
    if (paused || !active) return;

    const relatedTarget = event.relatedTarget as HTMLElement | null;

    // 포커스가 컨테이너 밖으로 이동하려는 경우
    if (relatedTarget && !container.contains(relatedTarget)) {
      event.preventDefault();
      // 첫 번째 포커스 가능한 요소로 복귀
      focusFirst(container);
    }
  }

  /**
   * 트랩 활성화
   */
  function activate(): void {
    if (active) return;

    active = true;
    previouslyFocused = document.activeElement as HTMLElement;

    // 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    container.addEventListener('focusout', handleFocusOut);

    // 초기 포커스 설정
    requestAnimationFrame(() => {
      if (initialFocus) {
        const element =
          typeof initialFocus === 'string'
            ? container.querySelector<HTMLElement>(initialFocus)
            : initialFocus;
        if (element) {
          element.focus();
          return;
        }
      }
      // 기본: 첫 번째 포커스 가능한 요소
      focusFirst(container);
    });
  }

  /**
   * 트랩 비활성화
   */
  function deactivate(): void {
    if (!active) return;

    active = false;

    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('mousedown', handleClickOutside, true);
    container.removeEventListener('focusout', handleFocusOut);

    // 이전 포커스로 복귀
    const focusTarget = returnFocus ?? previouslyFocused;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      requestAnimationFrame(() => {
        focusTarget.focus();
      });
    }

    // 콜백 호출
    if (onDeactivate) {
      onDeactivate();
    }
  }

  /**
   * 트랩 일시정지 (중첩 모달 등)
   */
  function pause(): void {
    paused = true;
  }

  /**
   * 트랩 재개
   */
  function unpause(): void {
    paused = false;
  }

  /**
   * 활성 상태 확인
   */
  function isActive(): boolean {
    return active;
  }

  return {
    activate,
    deactivate,
    isActive,
    pause,
    unpause,
  };
}

/**
 * 간단한 포커스 트랩 (함수형)
 * 모달 컴포넌트에서 직접 사용
 */
export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== KEYS.TAB) return;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const firstElement = focusable[0];
  const lastElement = focusable[focusable.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
