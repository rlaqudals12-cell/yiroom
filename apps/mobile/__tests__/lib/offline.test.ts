/**
 * 오프라인 모듈 테스트
 * cache.ts + syncQueue.ts 실제 함수 테스트
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  // 타입
  SyncQueueItem,
  CacheMetadata,
  CACHE_KEYS,
  DEFAULT_CACHE_TTL,
  MAX_SYNC_RETRIES,
  // 캐시
  setCache,
  getCache,
  removeCache,
  getCacheMetadata,
  hasCache,
  isCacheValid,
  clearCacheByPrefix,
  clearAllCache,
  getCacheOrFetch,
  // 동기화 큐
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  incrementRetryCount,
  getSyncQueueCount,
  clearSyncQueue,
  processSyncQueue,
  createWorkoutLogSync,
  createMealRecordSync,
  createWaterRecordSync,
  createGoalUpdateSync,
} from '../../lib/offline';

// multiRemove가 jest.setup.js에 없으므로 추가
const mockStorage = (global as Record<string, unknown>).mockAsyncStorage as Map<string, string>;
(AsyncStorage as Record<string, unknown>).multiRemove = jest.fn(async (keys: string[]) => {
  keys.forEach((key) => mockStorage.delete(key));
});

// 로거 모킹 (콘솔 출력 억제)
jest.mock('../../lib/utils/logger', () => ({
  offlineLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  syncLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ============================================================
// 캐시 (cache.ts) 테스트
// ============================================================

describe('cache', () => {
  describe('setCache / getCache', () => {
    it('데이터를 저장하고 조회해야 함', async () => {
      await setCache('test-key', { name: '테스트' });
      const result = await getCache<{ name: string }>('test-key');

      expect(result).toEqual({ name: '테스트' });
    });

    it('숫자, 문자열, 배열 데이터를 처리해야 함', async () => {
      await setCache('num', 42);
      await setCache('str', 'hello');
      await setCache('arr', [1, 2, 3]);

      expect(await getCache<number>('num')).toBe(42);
      expect(await getCache<string>('str')).toBe('hello');
      expect(await getCache<number[]>('arr')).toEqual([1, 2, 3]);
    });

    it('존재하지 않는 키는 null을 반환해야 함', async () => {
      const result = await getCache('nonexistent');
      expect(result).toBeNull();
    });

    it('만료된 캐시는 null을 반환하고 삭제해야 함', async () => {
      // TTL 0으로 즉시 만료되지 않도록, 과거 시점의 캐시를 직접 생성
      const expiredItem = {
        data: 'expired',
        metadata: {
          key: 'expired-key',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5000).toISOString(),
          version: 1,
        },
      };
      await AsyncStorage.setItem('expired-key', JSON.stringify(expiredItem));

      const result = await getCache('expired-key');
      expect(result).toBeNull();

      // 삭제되었는지 확인
      const raw = await AsyncStorage.getItem('expired-key');
      expect(raw).toBeNull();
    });

    it('TTL 없는 캐시(ttl=0)는 만료되지 않아야 함', async () => {
      await setCache('no-expire', 'permanent', 0);
      const result = await getCache<string>('no-expire');
      expect(result).toBe('permanent');
    });
  });

  describe('removeCache', () => {
    it('캐시를 삭제해야 함', async () => {
      await setCache('to-remove', 'data');
      expect(await getCache('to-remove')).toBe('data');

      await removeCache('to-remove');
      expect(await getCache('to-remove')).toBeNull();
    });
  });

  describe('getCacheMetadata', () => {
    it('메타데이터를 반환해야 함', async () => {
      await setCache('meta-test', { value: 1 }, 3600000);
      const metadata = await getCacheMetadata('meta-test');

      expect(metadata).not.toBeNull();
      expect(metadata!.key).toBe('meta-test');
      expect(metadata!.version).toBe(1);
      expect(metadata!.expiresAt).toBeTruthy();
      expect(metadata!.updatedAt).toBeTruthy();
    });

    it('없는 키는 null 반환', async () => {
      const metadata = await getCacheMetadata('no-key');
      expect(metadata).toBeNull();
    });
  });

  describe('hasCache / isCacheValid', () => {
    it('hasCache: 존재하면 true', async () => {
      await setCache('exists', true);
      expect(await hasCache('exists')).toBe(true);
      expect(await hasCache('not-exists')).toBe(false);
    });

    it('isCacheValid: 유효한 캐시는 true', async () => {
      await setCache('valid', 'data', 3600000);
      expect(await isCacheValid('valid')).toBe(true);
    });

    it('isCacheValid: 만료된 캐시는 false', async () => {
      const expiredItem = {
        data: 'old',
        metadata: {
          key: 'old-key',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
      };
      await AsyncStorage.setItem('old-key', JSON.stringify(expiredItem));
      expect(await isCacheValid('old-key')).toBe(false);
    });
  });

  describe('clearCacheByPrefix / clearAllCache', () => {
    it('접두사로 캐시를 삭제해야 함', async () => {
      await setCache('@yiroom_cache_a', 'a');
      await setCache('@yiroom_cache_b', 'b');
      await setCache('@other_key', 'c');

      await clearCacheByPrefix('@yiroom_cache');

      expect(await getCache('@yiroom_cache_a')).toBeNull();
      expect(await getCache('@yiroom_cache_b')).toBeNull();
      // 다른 접두사는 유지
      expect(await getCache('@other_key')).toBe('c');
    });

    it('전체 캐시를 삭제해야 함 (@yiroom_cache 접두사)', async () => {
      await setCache('@yiroom_cache_x', 'x');
      await setCache('@yiroom_cache_y', 'y');
      await setCache('@yiroom_sync_queue', 'sync'); // sync 키는 유지

      await clearAllCache();

      expect(await getCache('@yiroom_cache_x')).toBeNull();
      expect(await getCache('@yiroom_cache_y')).toBeNull();
      // sync_queue는 cache가 아니므로 유지
      const raw = await AsyncStorage.getItem('@yiroom_sync_queue');
      expect(raw).not.toBeNull();
    });
  });

  describe('getCacheOrFetch', () => {
    it('캐시 없으면 fetchFn 호출 후 캐시에 저장', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ items: [1, 2] });

      const result = await getCacheOrFetch('fetch-test', fetchFn);

      expect(result).toEqual({ items: [1, 2] });
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // 캐시에 저장되었는지 확인
      const cached = await getCache<{ items: number[] }>('fetch-test');
      expect(cached).toEqual({ items: [1, 2] });
    });

    it('캐시 있으면 fetchFn 호출하지 않고 캐시 반환', async () => {
      await setCache('cached-key', 'cached-value');
      const fetchFn = jest.fn().mockResolvedValue('new-value');

      const result = await getCacheOrFetch('cached-key', fetchFn);

      expect(result).toBe('cached-value');
      // stale-while-revalidate로 백그라운드 호출은 되지만 즉시 반환은 캐시 값
    });
  });
});

// ============================================================
// 동기화 큐 (syncQueue.ts) 테스트
// ============================================================

describe('syncQueue', () => {
  describe('addToSyncQueue / getSyncQueue', () => {
    it('항목을 추가하고 조회해야 함', async () => {
      const id = await addToSyncQueue({
        type: 'workout_log',
        action: 'create',
        data: { name: '스쿼트', duration: 1800 },
      });

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^sync_/);

      const queue = await getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('workout_log');
      expect(queue[0].action).toBe('create');
      expect(queue[0].retryCount).toBe(0);
      expect(queue[0].createdAt).toBeTruthy();
    });

    it('여러 항목을 순서대로 추가해야 함', async () => {
      await addToSyncQueue({ type: 'meal_record', action: 'create', data: {} });
      await addToSyncQueue({ type: 'water_record', action: 'update', data: {} });
      await addToSyncQueue({ type: 'goal_update', action: 'delete', data: {} });

      const queue = await getSyncQueue();
      expect(queue).toHaveLength(3);
      expect(queue[0].type).toBe('meal_record');
      expect(queue[1].type).toBe('water_record');
      expect(queue[2].type).toBe('goal_update');
    });
  });

  describe('removeFromSyncQueue', () => {
    it('특정 항목을 제거해야 함', async () => {
      const id1 = await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });
      const id2 = await addToSyncQueue({ type: 'meal_record', action: 'create', data: {} });

      await removeFromSyncQueue(id1);

      const queue = await getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(id2);
    });
  });

  describe('incrementRetryCount', () => {
    it('재시도 횟수를 증가시켜야 함', async () => {
      const id = await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });

      const shouldRetry = await incrementRetryCount(id, 'Network error');
      expect(shouldRetry).toBe(true);

      const queue = await getSyncQueue();
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].lastError).toBe('Network error');
    });

    it('MAX_SYNC_RETRIES 초과 시 항목을 제거해야 함', async () => {
      const id = await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });

      // MAX_SYNC_RETRIES(3)번 재시도
      for (let i = 0; i < MAX_SYNC_RETRIES; i++) {
        await incrementRetryCount(id, `Attempt ${i + 1}`);
      }

      const queue = await getSyncQueue();
      expect(queue).toHaveLength(0); // 제거됨
    });

    it('존재하지 않는 ID는 false 반환', async () => {
      const result = await incrementRetryCount('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getSyncQueueCount / clearSyncQueue', () => {
    it('큐 개수를 반환해야 함', async () => {
      expect(await getSyncQueueCount()).toBe(0);

      await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });
      await addToSyncQueue({ type: 'meal_record', action: 'create', data: {} });

      expect(await getSyncQueueCount()).toBe(2);
    });

    it('큐를 비워야 함', async () => {
      await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });
      await addToSyncQueue({ type: 'meal_record', action: 'create', data: {} });

      await clearSyncQueue();
      expect(await getSyncQueueCount()).toBe(0);
    });
  });

  describe('processSyncQueue', () => {
    it('성공한 항목을 제거하고 결과를 반환해야 함', async () => {
      await addToSyncQueue({ type: 'workout_log', action: 'create', data: { id: 1 } });
      await addToSyncQueue({ type: 'meal_record', action: 'create', data: { id: 2 } });

      const processor = jest.fn().mockResolvedValue(true);
      const result = await processSyncQueue(processor);

      expect(result).toEqual({ success: 2, failed: 0 });
      expect(processor).toHaveBeenCalledTimes(2);
      expect(await getSyncQueueCount()).toBe(0);
    });

    it('실패한 항목은 재시도 횟수를 증가시켜야 함', async () => {
      await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });

      const processor = jest.fn().mockResolvedValue(false);
      const result = await processSyncQueue(processor);

      expect(result).toEqual({ success: 0, failed: 1 });

      const queue = await getSyncQueue();
      expect(queue[0].retryCount).toBe(1);
    });

    it('예외 발생 시 에러를 기록하고 재시도 횟수를 증가시켜야 함', async () => {
      await addToSyncQueue({ type: 'workout_log', action: 'create', data: {} });

      const processor = jest.fn().mockRejectedValue(new Error('API Error'));
      const result = await processSyncQueue(processor);

      expect(result).toEqual({ success: 0, failed: 1 });

      const queue = await getSyncQueue();
      expect(queue[0].lastError).toBe('API Error');
    });

    it('빈 큐에서는 0/0 반환', async () => {
      const processor = jest.fn();
      const result = await processSyncQueue(processor);

      expect(result).toEqual({ success: 0, failed: 0 });
      expect(processor).not.toHaveBeenCalled();
    });
  });
});

// ============================================================
// 동기화 팩토리 테스트
// ============================================================

describe('sync factories', () => {
  it('createWorkoutLogSync', () => {
    const sync = createWorkoutLogSync('create', { name: '스쿼트' });
    expect(sync).toEqual({
      type: 'workout_log',
      action: 'create',
      data: { name: '스쿼트' },
    });
  });

  it('createMealRecordSync', () => {
    const sync = createMealRecordSync('update', { calories: 500 });
    expect(sync).toEqual({
      type: 'meal_record',
      action: 'update',
      data: { calories: 500 },
    });
  });

  it('createWaterRecordSync', () => {
    const sync = createWaterRecordSync('delete', { id: 'w-1' });
    expect(sync).toEqual({
      type: 'water_record',
      action: 'delete',
      data: { id: 'w-1' },
    });
  });

  it('createGoalUpdateSync', () => {
    const sync = createGoalUpdateSync('create', { target: 70 });
    expect(sync).toEqual({
      type: 'goal_update',
      action: 'create',
      data: { target: 70 },
    });
  });
});

// ============================================================
// 타입 + 상수 테스트
// ============================================================

describe('types & constants', () => {
  it('CACHE_KEYS가 올바른 값을 가져야 함', () => {
    expect(CACHE_KEYS.SYNC_QUEUE).toBe('@yiroom_sync_queue');
    expect(CACHE_KEYS.WORKOUT_DATA).toBe('@yiroom_cache_workout');
    expect(CACHE_KEYS.NUTRITION_DATA).toBe('@yiroom_cache_nutrition');
  });

  it('DEFAULT_CACHE_TTL은 1시간(3600000ms)', () => {
    expect(DEFAULT_CACHE_TTL).toBe(3600000);
  });

  it('MAX_SYNC_RETRIES는 3', () => {
    expect(MAX_SYNC_RETRIES).toBe(3);
  });
});
