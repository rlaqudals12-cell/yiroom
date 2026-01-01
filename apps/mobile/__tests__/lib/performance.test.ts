/**
 * 성능 훅 테스트
 */

import { renderHook, act } from '@testing-library/react-hooks';
import {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  usePrevious,
  useIsMounted,
  useLazyLoad,
  useInterval,
  useTimeout,
} from '../../lib/performance/hooks';
import { deepEqual, shallowEqual } from '../../lib/performance/components';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('초기 값을 즉시 반환해야 함', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('delay 후 값이 업데이트되어야 함', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // 값 변경
    rerender({ value: 'updated', delay: 500 });

    // delay 전에는 변경되지 않아야 함
    expect(result.current).toBe('initial');

    // delay 후 변경
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('연속 호출 시 마지막 값만 반영해야 함', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'd' });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('d');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delay 후 콜백이 실행되어야 함', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current('arg1');
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('arg1');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('연속 호출 시 마지막 콜백만 실행해야 함', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current('a');
    result.current('b');
    result.current('c');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('c');
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('초기 값을 반환해야 함', () => {
    const { result } = renderHook(() => useThrottle('test', 500));
    expect(result.current).toBe('test');
  });

  it('interval 후 값이 업데이트되어야 함', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });
});

describe('usePrevious', () => {
  it('이전 값을 추적해야 함', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 1 } }
    );

    // 초기 렌더링 시 undefined
    expect(result.current).toBeUndefined();

    // 값 변경 후
    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});

describe('useIsMounted', () => {
  it('마운트 상태를 추적해야 함', () => {
    const { result, unmount } = renderHook(() => useIsMounted());

    expect(result.current()).toBe(true);

    unmount();

    expect(result.current()).toBe(false);
  });
});

describe('useLazyLoad', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delay가 0이면 즉시 로드해야 함', () => {
    const { result } = renderHook(() => useLazyLoad(0));
    expect(result.current).toBe(true);
  });

  it('delay 후 로드해야 함', () => {
    const { result } = renderHook(() => useLazyLoad(500));

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });
});

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('interval마다 콜백을 실행해야 함', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('delay가 null이면 실행하지 않아야 함', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delay 후 콜백을 한 번만 실행해야 함', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('delay가 null이면 실행하지 않아야 함', () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('deepEqual', () => {
  it('동일한 원시 값을 비교해야 함', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('test', 'test')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it('다른 원시 값을 구분해야 함', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it('중첩된 객체를 비교해야 함', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    const obj3 = { a: 1, b: { c: 3 } };

    expect(deepEqual(obj1, obj2)).toBe(true);
    expect(deepEqual(obj1, obj3)).toBe(false);
  });

  it('배열을 비교해야 함', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });
});

describe('shallowEqual', () => {
  it('동일한 원시 값을 비교해야 함', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual('test', 'test')).toBe(true);
  });

  it('1단계 깊이 객체를 비교해야 함', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    const obj3 = { a: 1, b: 3 };

    expect(shallowEqual(obj1, obj2)).toBe(true);
    expect(shallowEqual(obj1, obj3)).toBe(false);
  });

  it('중첩된 객체 참조가 다르면 false여야 함', () => {
    const obj1 = { a: { b: 1 } };
    const obj2 = { a: { b: 1 } };

    expect(shallowEqual(obj1, obj2)).toBe(false);
  });

  it('동일한 참조면 true여야 함', () => {
    const nested = { b: 1 };
    const obj1 = { a: nested };
    const obj2 = { a: nested };

    expect(shallowEqual(obj1, obj2)).toBe(true);
  });
});
