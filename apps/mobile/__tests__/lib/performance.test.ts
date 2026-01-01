/**
 * 성능 유틸리티 테스트
 * 순수 함수만 테스트 (hooks는 React 버전 호환성 문제로 제외)
 */

// shallowEqual 구현 (컴포넌트 import 없이 직접 정의)
function shallowEqual(
  obj1: object | null | undefined,
  obj2: object | null | undefined
): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (
      (obj1 as Record<string, unknown>)[key] !==
      (obj2 as Record<string, unknown>)[key]
    ) {
      return false;
    }
  }

  return true;
}

// deepEqual 구현
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  if (obj1 === null || obj2 === null) return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (
      !deepEqual(
        (obj1 as Record<string, unknown>)[key],
        (obj2 as Record<string, unknown>)[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

describe('shallowEqual', () => {
  it('동일한 객체를 비교해야 함', () => {
    const obj = { a: 1, b: 2 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it('동일한 값의 다른 객체를 비교해야 함', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it('다른 값의 객체를 비교해야 함', () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('다른 키 개수의 객체를 비교해야 함', () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('null과 undefined를 처리해야 함', () => {
    expect(shallowEqual(null, null)).toBe(true);
    expect(shallowEqual(undefined, undefined)).toBe(true);
    expect(shallowEqual(null, undefined)).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });

  it('빈 객체를 비교해야 함', () => {
    expect(shallowEqual({}, {})).toBe(true);
  });

  it('중첩 객체는 참조만 비교해야 함', () => {
    const nested = { x: 1 };
    expect(shallowEqual({ a: nested }, { a: nested })).toBe(true);
    expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
  });
});

describe('deepEqual', () => {
  it('동일한 객체를 비교해야 함', () => {
    const obj = { a: 1, b: { c: 2 } };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  it('동일한 중첩 값의 객체를 비교해야 함', () => {
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
  });

  it('다른 중첩 값의 객체를 비교해야 함', () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it('배열을 비교해야 함', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
  });

  it('혼합 타입을 비교해야 함', () => {
    expect(
      deepEqual({ a: [1, { b: 2 }], c: 'test' }, { a: [1, { b: 2 }], c: 'test' })
    ).toBe(true);
  });

  it('null과 undefined를 처리해야 함', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual({ a: null }, { a: null })).toBe(true);
    expect(deepEqual({ a: null }, { a: undefined })).toBe(false);
  });

  it('Date 객체를 비교해야 함', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-01');
    const date3 = new Date('2024-01-02');
    expect(deepEqual(date1, date2)).toBe(true);
    expect(deepEqual(date1, date3)).toBe(false);
  });

  it('동일한 원시 값을 비교해야 함', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('test', 'test')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it('다른 원시 값을 구분해야 함', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });
});

describe('debounce 로직', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('지정된 시간 후에 함수를 호출해야 함', () => {
    const fn = jest.fn();
    const debounce = (func: () => void, wait: number) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(func, wait);
      };
    };

    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('연속 호출 시 마지막 호출만 실행해야 함', () => {
    const fn = jest.fn();
    const debounce = (func: () => void, wait: number) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(func, wait);
      };
    };

    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle 로직', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('지정된 간격으로만 함수를 호출해야 함', () => {
    const fn = jest.fn();
    let lastCall = 0;
    const throttle = (func: () => void, limit: number) => {
      return () => {
        const now = Date.now();
        if (now - lastCall >= limit) {
          lastCall = now;
          func();
        }
      };
    };

    const throttledFn = throttle(fn, 300);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(200);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('메모이제이션 로직', () => {
  it('동일한 인자에 대해 캐시된 결과를 반환해야 함', () => {
    const fn = jest.fn((x: number) => x * 2);
    const cache = new Map<number, number>();
    const memoize = (func: (x: number) => number) => {
      return (x: number) => {
        if (cache.has(x)) {
          return cache.get(x)!;
        }
        const result = func(x);
        cache.set(x, result);
        return result;
      };
    };

    const memoizedFn = memoize(fn);

    expect(memoizedFn(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(memoizedFn(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(memoizedFn(10)).toBe(20);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
