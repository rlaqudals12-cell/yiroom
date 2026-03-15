import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpertMode } from '@/hooks/useExpertMode';

describe('useExpertMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 상태는 false이다', () => {
    const { result } = renderHook(() => useExpertMode());
    expect(result.current.isExpert).toBe(false);
  });

  it('toggleExpert 호출 시 true로 변경된다', () => {
    const { result } = renderHook(() => useExpertMode());

    act(() => {
      result.current.toggleExpert();
    });

    expect(result.current.isExpert).toBe(true);
  });

  it('두 번 토글하면 false로 돌아온다', () => {
    const { result } = renderHook(() => useExpertMode());

    act(() => {
      result.current.toggleExpert();
    });
    act(() => {
      result.current.toggleExpert();
    });

    expect(result.current.isExpert).toBe(false);
  });

  it('localStorage에 상태를 저장한다', () => {
    const { result } = renderHook(() => useExpertMode());

    act(() => {
      result.current.toggleExpert();
    });

    expect(localStorage.getItem('yiroom-expert-mode')).toBe('true');
  });

  it('localStorage에서 초기값을 복원한다', () => {
    localStorage.setItem('yiroom-expert-mode', 'true');

    const { result } = renderHook(() => useExpertMode());
    // useEffect 실행 후
    expect(result.current.isExpert).toBe(true);
  });

  it('localStorage 접근 실패 시 에러를 던지지 않는다', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('접근 불가');
    });

    expect(() => {
      renderHook(() => useExpertMode());
    }).not.toThrow();

    getItemSpy.mockRestore();
  });
});
