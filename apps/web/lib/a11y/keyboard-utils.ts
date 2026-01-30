/**
 * 키보드 접근성 유틸리티
 *
 * WCAG 2.1 AA 준수:
 * - 2.1.1: 모든 기능 키보드 접근 가능
 * - 2.1.2: 키보드 트랩 방지
 * - 2.4.3: 논리적 포커스 순서
 *
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A4
 */

/**
 * 키보드 키 코드 상수
 */
export const KEYS = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyCode = (typeof KEYS)[keyof typeof KEYS];

/**
 * 키 이벤트 타입 가드
 */
export function isKey(event: KeyboardEvent, key: KeyCode): boolean {
  return event.key === key;
}

/**
 * 여러 키 중 하나인지 확인
 */
export function isOneOfKeys(event: KeyboardEvent, keys: KeyCode[]): boolean {
  return keys.includes(event.key as KeyCode);
}

/**
 * Enter 또는 Space 키인지 확인 (버튼 활성화)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return isOneOfKeys(event, [KEYS.ENTER, KEYS.SPACE]);
}

/**
 * 방향키인지 확인
 */
export function isArrowKey(event: KeyboardEvent): boolean {
  return isOneOfKeys(event, [
    KEYS.ARROW_UP,
    KEYS.ARROW_DOWN,
    KEYS.ARROW_LEFT,
    KEYS.ARROW_RIGHT,
  ]);
}

/**
 * 포커스 가능한 요소 선택자
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/**
 * 컨테이너 내 포커스 가능한 요소 목록 반환
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(elements).filter((el) => {
    // display: none 또는 visibility: hidden 체크
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    // hidden 속성 체크
    if (el.hidden) {
      return false;
    }
    return true;
  });
}

/**
 * 첫 번째 포커스 가능한 요소로 이동
 */
export function focusFirst(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return focusable[0];
  }
  return null;
}

/**
 * 마지막 포커스 가능한 요소로 이동
 */
export function focusLast(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    const last = focusable[focusable.length - 1];
    last.focus();
    return last;
  }
  return null;
}

/**
 * 다음 포커스 요소로 이동 (순환)
 */
export function focusNext(
  container: HTMLElement,
  currentElement: HTMLElement,
  wrap: boolean = true
): HTMLElement | null {
  const focusable = getFocusableElements(container);
  const currentIndex = focusable.indexOf(currentElement);

  if (currentIndex === -1) {
    return focusFirst(container);
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= focusable.length) {
    if (wrap) {
      focusable[0].focus();
      return focusable[0];
    }
    return null;
  }

  focusable[nextIndex].focus();
  return focusable[nextIndex];
}

/**
 * 이전 포커스 요소로 이동 (순환)
 */
export function focusPrevious(
  container: HTMLElement,
  currentElement: HTMLElement,
  wrap: boolean = true
): HTMLElement | null {
  const focusable = getFocusableElements(container);
  const currentIndex = focusable.indexOf(currentElement);

  if (currentIndex === -1) {
    return focusLast(container);
  }

  const prevIndex = currentIndex - 1;
  if (prevIndex < 0) {
    if (wrap) {
      const last = focusable[focusable.length - 1];
      last.focus();
      return last;
    }
    return null;
  }

  focusable[prevIndex].focus();
  return focusable[prevIndex];
}

/**
 * 리스트 네비게이션 방향
 */
export type NavigationDirection = 'horizontal' | 'vertical' | 'both';

/**
 * 리스트 아이템 키보드 네비게이션 핸들러 옵션
 */
export interface ListNavigationOptions {
  /** 네비게이션 방향 */
  direction?: NavigationDirection;
  /** 순환 네비게이션 */
  wrap?: boolean;
  /** Home/End 키 지원 */
  homeEnd?: boolean;
  /** 포커스 이동 콜백 */
  onFocusChange?: (index: number, element: HTMLElement) => void;
}

/**
 * 리스트 키보드 네비게이션 핸들러
 */
export function handleListKeyDown(
  event: KeyboardEvent,
  container: HTMLElement,
  options: ListNavigationOptions = {}
): void {
  const {
    direction = 'both',
    wrap = true,
    homeEnd = true,
    onFocusChange,
  } = options;

  const currentElement = document.activeElement as HTMLElement;
  if (!container.contains(currentElement)) return;

  let newElement: HTMLElement | null = null;
  let shouldPrevent = false;

  // 세로 방향 (Up/Down)
  if (direction === 'vertical' || direction === 'both') {
    if (isKey(event, KEYS.ARROW_DOWN)) {
      newElement = focusNext(container, currentElement, wrap);
      shouldPrevent = true;
    } else if (isKey(event, KEYS.ARROW_UP)) {
      newElement = focusPrevious(container, currentElement, wrap);
      shouldPrevent = true;
    }
  }

  // 가로 방향 (Left/Right)
  if (direction === 'horizontal' || direction === 'both') {
    if (isKey(event, KEYS.ARROW_RIGHT)) {
      newElement = focusNext(container, currentElement, wrap);
      shouldPrevent = true;
    } else if (isKey(event, KEYS.ARROW_LEFT)) {
      newElement = focusPrevious(container, currentElement, wrap);
      shouldPrevent = true;
    }
  }

  // Home/End 키
  if (homeEnd) {
    if (isKey(event, KEYS.HOME)) {
      newElement = focusFirst(container);
      shouldPrevent = true;
    } else if (isKey(event, KEYS.END)) {
      newElement = focusLast(container);
      shouldPrevent = true;
    }
  }

  if (shouldPrevent) {
    event.preventDefault();
  }

  // 콜백 호출
  if (newElement && onFocusChange) {
    const focusable = getFocusableElements(container);
    const newIndex = focusable.indexOf(newElement);
    if (newIndex !== -1) {
      onFocusChange(newIndex, newElement);
    }
  }
}

/**
 * 탭 패널 키보드 핸들러
 * - Arrow Left/Right: 탭 전환
 * - Home: 첫 번째 탭
 * - End: 마지막 탭
 */
export function handleTabListKeyDown(
  event: KeyboardEvent,
  tabList: HTMLElement,
  onTabChange: (index: number) => void
): void {
  const focusable = getFocusableElements(tabList);
  const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) return;

  let newIndex = currentIndex;
  let shouldPrevent = false;

  if (isKey(event, KEYS.ARROW_RIGHT)) {
    newIndex = (currentIndex + 1) % focusable.length;
    shouldPrevent = true;
  } else if (isKey(event, KEYS.ARROW_LEFT)) {
    newIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1;
    shouldPrevent = true;
  } else if (isKey(event, KEYS.HOME)) {
    newIndex = 0;
    shouldPrevent = true;
  } else if (isKey(event, KEYS.END)) {
    newIndex = focusable.length - 1;
    shouldPrevent = true;
  }

  if (shouldPrevent) {
    event.preventDefault();
    focusable[newIndex].focus();
    onTabChange(newIndex);
  }
}

/**
 * Roving tabindex 설정
 * 컨테이너 내 하나의 요소만 tabindex="0", 나머지는 tabindex="-1"
 */
export function setRovingTabIndex(
  container: HTMLElement,
  activeIndex: number
): void {
  const focusable = getFocusableElements(container);
  focusable.forEach((el, index) => {
    el.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
  });
}

/**
 * 스킵 링크 생성
 * 페이지 상단에서 본문으로 건너뛰기
 */
export function createSkipLink(
  targetId: string,
  text: string = '본문으로 건너뛰기'
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground';
  link.textContent = text;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return link;
}
