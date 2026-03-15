import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  it('기본 activeIndex는 0이다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));
    expect(result.current.activeIndex).toBe(0);
  });

  it('initialIndex로 초기 인덱스를 설정한다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, initialIndex: 2 }));
    expect(result.current.activeIndex).toBe(2);
  });

  it('setActiveIndex로 인덱스를 변경한다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));

    act(() => {
      result.current.setActiveIndex(3);
    });

    expect(result.current.activeIndex).toBe(3);
  });

  it('wrap=true일 때 마지막에서 처음으로 순환한다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, wrap: true }));

    act(() => {
      result.current.setActiveIndex(3); // count를 넘어감
    });

    expect(result.current.activeIndex).toBe(0); // 처음으로 순환
  });

  it('wrap=true일 때 음수에서 마지막으로 순환한다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, wrap: true }));

    act(() => {
      result.current.setActiveIndex(-1);
    });

    expect(result.current.activeIndex).toBe(2); // 마지막으로 순환
  });

  it('wrap=false일 때 범위를 벗어나지 않는다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, wrap: false }));

    act(() => {
      result.current.setActiveIndex(10);
    });

    expect(result.current.activeIndex).toBe(2); // 최대값 클램프

    act(() => {
      result.current.setActiveIndex(-5);
    });

    expect(result.current.activeIndex).toBe(0); // 최소값 클램프
  });

  it('containerProps에 onKeyDown과 role이 있다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3 }));

    expect(result.current.containerProps.onKeyDown).toBeInstanceOf(Function);
    expect(result.current.containerProps.role).toBe('listbox');
  });

  it('getItemProps가 올바른 props를 반환한다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3 }));

    const activeProps = result.current.getItemProps(0);
    expect(activeProps.tabIndex).toBe(0);
    expect(activeProps['aria-selected']).toBe(true);

    const inactiveProps = result.current.getItemProps(1);
    expect(inactiveProps.tabIndex).toBe(-1);
    expect(inactiveProps['aria-selected']).toBe(false);
  });

  it('onActiveChange 콜백이 호출된다', () => {
    const onActiveChange = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, onActiveChange }));

    act(() => {
      result.current.setActiveIndex(2);
    });

    expect(onActiveChange).toHaveBeenCalledWith(2);
  });

  it('onSelect 콜백이 getItemProps onClick에서 호출된다', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, onSelect }));

    const props = result.current.getItemProps(1);

    act(() => {
      props.onClick();
    });

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('itemCount가 0이면 setActiveIndex가 무시된다', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 0 }));

    act(() => {
      result.current.setActiveIndex(5);
    });

    expect(result.current.activeIndex).toBe(0); // 변경 안됨
  });
});
