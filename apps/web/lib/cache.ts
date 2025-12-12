/**
 * 메모리 캐시 유틸리티
 *
 * Task 6.3: 캐싱 최적화
 * - TTL(Time-To-Live) 지원
 * - LRU(Least Recently Used) 방식 메모리 관리
 * - 함수 결과 메모이제이션
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccess: number;
}

interface CacheOptions {
  /** 캐시 만료 시간 (ms) - 기본 5분 */
  ttl?: number;
  /** 최대 캐시 항목 수 - 기본 100개 */
  maxSize?: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5분
const DEFAULT_MAX_SIZE = 100;

/**
 * 메모리 캐시 클래스
 * LRU 방식으로 오래된 항목 자동 삭제
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttl = options.ttl ?? DEFAULT_TTL;
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  }

  /**
   * 캐시에서 값 가져오기
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 만료 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU: 마지막 접근 시간 업데이트
    entry.lastAccess = Date.now();
    return entry.value;
  }

  /**
   * 캐시에 값 저장
   */
  set(key: string, value: T, customTtl?: number): void {
    // 최대 크기 초과 시 LRU 정리
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (customTtl ?? this.ttl),
      lastAccess: Date.now(),
    });
  }

  /**
   * 캐시에서 값 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 캐시 전체 비우기
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 크기 반환
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 캐시에 키 존재 여부 (만료되지 않은 경우만)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * LRU 방식으로 가장 오래된 항목 삭제
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    // 먼저 만료된 항목 삭제
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        return; // 하나만 삭제하면 공간 확보
      }

      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    // 만료된 항목이 없으면 가장 오래된 항목 삭제
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 만료된 모든 항목 정리
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 캐시 통계 반환
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

/**
 * 캐시 키 생성 헬퍼
 * 객체를 안정적인 문자열 키로 변환
 */
export function createCacheKey(...args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        // 배열과 객체를 정렬된 형태로 직렬화
        return JSON.stringify(arg, Object.keys(arg as object).sort());
      }
      return String(arg);
    })
    .join(':');
}

/**
 * 함수 결과 메모이제이션 데코레이터
 * 동일한 인자로 호출 시 캐시된 결과 반환
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: CacheOptions = {}
): ((...args: TArgs) => TResult) & {
  cache: MemoryCache<TResult>;
  clearCache: () => void;
} {
  const cache = new MemoryCache<TResult>(options);

  const memoized = function (this: unknown, ...args: TArgs): TResult {
    const key = createCacheKey(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as ((...args: TArgs) => TResult) & {
    cache: MemoryCache<TResult>;
    clearCache: () => void;
  };

  // 캐시 접근 및 초기화 메서드 추가
  memoized.cache = cache;
  memoized.clearCache = () => cache.clear();

  return memoized;
}

/**
 * 비동기 함수 결과 메모이제이션
 */
export function memoizeAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: CacheOptions = {}
): ((...args: TArgs) => Promise<TResult>) & {
  cache: MemoryCache<TResult>;
  clearCache: () => void;
} {
  const cache = new MemoryCache<TResult>(options);
  const pending = new Map<string, Promise<TResult>>();

  const memoized = async function (
    this: unknown,
    ...args: TArgs
  ): Promise<TResult> {
    const key = createCacheKey(...args);

    // 캐시에서 조회
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // 이미 진행 중인 요청이 있으면 대기
    const pendingPromise = pending.get(key);
    if (pendingPromise) {
      return pendingPromise;
    }

    // 새 요청 시작
    const promise = fn.apply(this, args);
    pending.set(key, promise);

    try {
      const result = await promise;
      cache.set(key, result);
      return result;
    } finally {
      pending.delete(key);
    }
  } as ((...args: TArgs) => Promise<TResult>) & {
    cache: MemoryCache<TResult>;
    clearCache: () => void;
  };

  memoized.cache = cache;
  memoized.clearCache = () => cache.clear();

  return memoized;
}

// 전역 캐시 인스턴스 (운동 추천용)
export const workoutCache = new MemoryCache<unknown>({
  ttl: 10 * 60 * 1000, // 10분
  maxSize: 50,
});

// 전역 캐시 인스턴스 (연예인 매칭용)
export const celebrityCache = new MemoryCache<unknown>({
  ttl: 30 * 60 * 1000, // 30분 (자주 변경되지 않음)
  maxSize: 30,
});

// 전역 캐시 인스턴스 (스타일 추천용)
// 현재 미사용 - 향후 PC 기반 스타일 API 연동 시 활용 예정
// 참고: getWorkoutStyleRecommendation()은 Math.random() 사용으로 직접 캐싱 부적합
export const styleCache = new MemoryCache<unknown>({
  ttl: 60 * 60 * 1000, // 1시간 (정적 데이터)
  maxSize: 20,
});
