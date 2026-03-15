import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('delay 전에는 이전 값을 유지한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    rerender({ value: 'b', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('a');
  });

  it('delay 후 새 값을 반환한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    rerender({ value: 'b', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('기본 delay는 300ms이다', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    });

    rerender({ value: 'y' });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('x');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('y');
  });

  it('연속 변경 시 마지막 값만 반환한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 200 },
    });

    rerender({ value: 'b', delay: 200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'c', delay: 200 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('c');
  });

  it('숫자 타입을 지원한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 100 },
    });

    rerender({ value: 42, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });

  it('null 값을 처리한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'test' as string | null, delay: 100 },
    });

    rerender({ value: null, delay: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBeNull();
  });

  it('delay 0이면 즉시 반영한다', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 0 },
    });

    rerender({ value: 'b', delay: 0 });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('b');
  });
});
