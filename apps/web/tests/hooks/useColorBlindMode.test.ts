import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColorBlindMode } from '@/hooks/useColorBlindMode';

describe('useColorBlindMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-blind');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-color-blind');
  });

  it('should default to false', () => {
    const { result } = renderHook(() => useColorBlindMode());
    expect(result.current.isColorBlind).toBe(false);
  });

  it('should toggle color blind mode', () => {
    const { result } = renderHook(() => useColorBlindMode());

    act(() => {
      result.current.toggleColorBlind();
    });

    expect(result.current.isColorBlind).toBe(true);
    expect(localStorage.getItem('yiroom-color-blind-mode')).toBe('true');
    expect(document.documentElement.getAttribute('data-color-blind')).toBe('true');
  });

  it('should toggle off', () => {
    localStorage.setItem('yiroom-color-blind-mode', 'true');
    const { result } = renderHook(() => useColorBlindMode());

    act(() => {
      result.current.toggleColorBlind();
    });

    expect(result.current.isColorBlind).toBe(false);
    expect(localStorage.getItem('yiroom-color-blind-mode')).toBe('false');
    expect(document.documentElement.hasAttribute('data-color-blind')).toBe(false);
  });

  it('should restore from localStorage on mount', () => {
    localStorage.setItem('yiroom-color-blind-mode', 'true');
    const { result } = renderHook(() => useColorBlindMode());

    // useEffect runs after render
    expect(result.current.isColorBlind).toBe(true);
  });
});
