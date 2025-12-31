import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemoryCache,
  createCacheKey,
  memoize,
  memoizeAsync,
  workoutCache,
  styleCache,
} from '@/lib/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>({ ttl: 1000, maxSize: 5 });
  });

  describe('기본 동작', () => {
    it('값을 저장하고 조회할 수 있다', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('존재하지 않는 키는 undefined 반환', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('값을 삭제할 수 있다', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('캐시를 비울 수 있다', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('키 존재 여부를 확인할 수 있다', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL (만료)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('TTL 이후 값이 만료된다', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // 1초 후
      vi.advanceTimersByTime(1001);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('커스텀 TTL을 설정할 수 있다', () => {
      cache.set('key1', 'value1', 500); // 500ms

      vi.advanceTimersByTime(400);
      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(200);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('만료된 키는 has()에서 false 반환', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      vi.advanceTimersByTime(1001);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('LRU 정리', () => {
    it('최대 크기 초과 시 가장 오래된 항목 삭제', () => {
      // maxSize: 5
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // 6번째 항목 추가 시 가장 오래된 key1 삭제
      cache.set('key6', 'value6');

      expect(cache.size).toBe(5);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });

    it('접근한 항목은 LRU에서 우선순위가 높아진다', () => {
      vi.useFakeTimers();

      cache.set('key1', 'value1');
      vi.advanceTimersByTime(10);
      cache.set('key2', 'value2');
      vi.advanceTimersByTime(10);
      cache.set('key3', 'value3');
      vi.advanceTimersByTime(10);
      cache.set('key4', 'value4');
      vi.advanceTimersByTime(10);
      cache.set('key5', 'value5');

      // key1에 접근하여 lastAccess 갱신
      vi.advanceTimersByTime(10);
      cache.get('key1');

      // 새 항목 추가 - key2가 삭제되어야 함 (key1보다 오래됨)
      cache.set('key6', 'value6');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('만료된 항목을 정리한다', () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 200);
      cache.set('key3', 'value3', 2000);

      vi.advanceTimersByTime(150);
      const cleaned = cache.cleanup();

      expect(cleaned).toBe(1); // key1만 만료
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('캐시 통계를 반환한다', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.ttl).toBe(1000);
    });
  });
});

describe('createCacheKey', () => {
  it('기본 타입을 문자열로 변환한다', () => {
    expect(createCacheKey('str', 123, true)).toBe('str:123:true');
  });

  it('null과 undefined를 처리한다', () => {
    expect(createCacheKey(null, undefined)).toBe('null:undefined');
  });

  it('객체를 정렬된 JSON으로 변환한다', () => {
    const key1 = createCacheKey({ b: 2, a: 1 });
    const key2 = createCacheKey({ a: 1, b: 2 });
    expect(key1).toBe(key2); // 순서 무관하게 같은 키
  });

  it('배열을 처리한다', () => {
    expect(createCacheKey([1, 2, 3])).toBe('[1,2,3]');
  });

  it('복합 인자를 처리한다', () => {
    const key = createCacheKey('type', { concerns: ['belly'] }, 10);
    expect(key).toContain('type');
    expect(key).toContain('concerns');
    expect(key).toContain('belly');
  });
});

describe('memoize', () => {
  it('동일한 인자에 대해 캐시된 결과 반환', () => {
    let callCount = 0;
    const fn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };

    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(callCount).toBe(1); // 한 번만 호출됨
  });

  it('다른 인자에 대해 새로 계산', () => {
    let callCount = 0;
    const fn = (a: number) => {
      callCount++;
      return a * 2;
    };

    const memoized = memoize(fn);

    expect(memoized(1)).toBe(2);
    expect(memoized(2)).toBe(4);
    expect(callCount).toBe(2);
  });

  it('캐시를 초기화할 수 있다', () => {
    let callCount = 0;
    const fn = () => {
      callCount++;
      return 'result';
    };

    const memoized = memoize(fn);

    memoized();
    memoized.clearCache();
    memoized();

    expect(callCount).toBe(2);
  });

  it('객체 인자도 캐싱된다', () => {
    let callCount = 0;
    const fn = (obj: { type: string }) => {
      callCount++;
      return obj.type;
    };

    const memoized = memoize(fn);

    expect(memoized({ type: 'test' })).toBe('test');
    expect(memoized({ type: 'test' })).toBe('test');
    expect(callCount).toBe(1);
  });
});

describe('memoizeAsync', () => {
  it('비동기 함수 결과를 캐싱한다', async () => {
    let callCount = 0;
    const asyncFn = async (x: number) => {
      callCount++;
      return x * 2;
    };

    const memoized = memoizeAsync(asyncFn);

    expect(await memoized(5)).toBe(10);
    expect(await memoized(5)).toBe(10);
    expect(callCount).toBe(1);
  });

  it('동시 요청을 중복 방지한다', async () => {
    let callCount = 0;
    const asyncFn = async (x: number) => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return x * 2;
    };

    const memoized = memoizeAsync(asyncFn);

    // 동시에 같은 인자로 요청
    const [result1, result2] = await Promise.all([memoized(3), memoized(3)]);

    expect(result1).toBe(6);
    expect(result2).toBe(6);
    expect(callCount).toBe(1); // 한 번만 호출됨
  });
});

describe('전역 캐시 인스턴스', () => {
  it('workoutCache가 존재한다', () => {
    expect(workoutCache).toBeDefined();
    expect(workoutCache.getStats().ttl).toBe(10 * 60 * 1000); // 10분
  });

  it('styleCache가 존재한다', () => {
    expect(styleCache).toBeDefined();
    expect(styleCache.getStats().ttl).toBe(60 * 60 * 1000); // 1시간
  });
});
