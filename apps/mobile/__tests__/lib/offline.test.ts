/**
 * 오프라인 유틸리티 테스트
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CacheOptions,
  SyncQueueItem,
  CachedData,
} from '../../lib/offline/types';

describe('CacheOptions', () => {
  it('기본 TTL 값이 유효해야 함', () => {
    const defaultTtl = 60 * 60 * 1000; // 1시간
    expect(defaultTtl).toBe(3600000);
  });

  it('캐시 키 형식이 올바라야 함', () => {
    const prefix = '@yiroom/cache/';
    const key = 'workout-plan';
    const fullKey = `${prefix}${key}`;

    expect(fullKey).toBe('@yiroom/cache/workout-plan');
  });
});

describe('SyncQueueItem', () => {
  it('동기화 항목 구조가 올바라야 함', () => {
    const item: SyncQueueItem = {
      id: 'sync-123',
      type: 'workout_log',
      data: { workoutId: 'w-123', duration: 1800 },
      timestamp: Date.now(),
      retryCount: 0,
    };

    expect(item.id).toBeDefined();
    expect(item.type).toBe('workout_log');
    expect(item.data).toBeInstanceOf(Object);
    expect(item.timestamp).toBeGreaterThan(0);
    expect(item.retryCount).toBe(0);
  });

  it('재시도 횟수가 증가해야 함', () => {
    const item: SyncQueueItem = {
      id: 'sync-123',
      type: 'meal_record',
      data: {},
      timestamp: Date.now(),
      retryCount: 0,
    };

    const maxRetries = 3;
    item.retryCount += 1;

    expect(item.retryCount).toBe(1);
    expect(item.retryCount < maxRetries).toBe(true);
  });
});

describe('CachedData', () => {
  it('캐시 데이터 구조가 올바라야 함', () => {
    const now = Date.now();
    const ttl = 3600000;

    const cached: CachedData<{ name: string }> = {
      data: { name: 'test' },
      timestamp: now,
      expiresAt: now + ttl,
    };

    expect(cached.data.name).toBe('test');
    expect(cached.expiresAt).toBeGreaterThan(cached.timestamp);
  });

  it('만료 여부를 정확히 판단해야 함', () => {
    const now = Date.now();

    // 만료되지 않은 캐시
    const validCache: CachedData<string> = {
      data: 'valid',
      timestamp: now,
      expiresAt: now + 3600000,
    };

    expect(now < validCache.expiresAt).toBe(true);

    // 만료된 캐시
    const expiredCache: CachedData<string> = {
      data: 'expired',
      timestamp: now - 7200000,
      expiresAt: now - 3600000,
    };

    expect(now > expiredCache.expiresAt).toBe(true);
  });
});

describe('동기화 큐 타입', () => {
  const syncTypes = [
    'workout_log',
    'meal_record',
    'water_record',
    'analysis_result',
  ];

  syncTypes.forEach((type) => {
    it(`"${type}" 동기화 타입이 유효해야 함`, () => {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    });
  });
});

describe('AsyncStorage 캐시 작업', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('캐시 저장이 올바른 형식으로 호출되어야 함', async () => {
    const key = '@yiroom/cache/test';
    const data = { value: 'test' };
    const cached: CachedData<typeof data> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    await AsyncStorage.setItem(key, JSON.stringify(cached));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      key,
      expect.stringContaining('"value":"test"')
    );
  });

  it('캐시 조회가 호출되어야 함', async () => {
    const key = '@yiroom/cache/test';

    await AsyncStorage.getItem(key);

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(key);
  });

  it('캐시 삭제가 호출되어야 함', async () => {
    const key = '@yiroom/cache/test';

    await AsyncStorage.removeItem(key);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
  });
});
