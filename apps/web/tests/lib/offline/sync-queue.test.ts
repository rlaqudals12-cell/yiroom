import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  addToSyncQueue,
  getSyncQueue,
  getPendingCount,
  updateSyncItemStatus,
  removeCompletedItems,
  clearSyncQueue,
} from '@/lib/offline/sync-queue';

describe('sync-queue', () => {
  // localStorage 모킹
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage 모킹
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => mockStorage[key] || null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        mockStorage[key] = value;
      }
    );
    // 스토리지 초기화
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addToSyncQueue', () => {
    it('항목 추가', () => {
      const item = addToSyncQueue('CREATE_MEAL', { name: 'test' });

      expect(item).toBeDefined();
      expect(item.type).toBe('CREATE_MEAL');
      expect(item.status).toBe('pending');
    });

    it('고유 ID 생성', () => {
      const item1 = addToSyncQueue('CREATE_MEAL', {});
      const item2 = addToSyncQueue('CREATE_MEAL', {});

      expect(item1.id).not.toBe(item2.id);
    });

    it('payload 저장', () => {
      const payload = { name: 'test', calories: 100 };
      const item = addToSyncQueue('CREATE_MEAL', payload);

      expect(item.payload).toEqual(payload);
    });

    it('초기 retryCount 0', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});

      expect(item.retryCount).toBe(0);
    });

    it('createdAt 타임스탬프', () => {
      const before = Date.now();
      const item = addToSyncQueue('CREATE_MEAL', {});
      const after = Date.now();

      expect(item.createdAt).toBeGreaterThanOrEqual(before);
      expect(item.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getSyncQueue', () => {
    it('빈 큐 반환', () => {
      const queue = getSyncQueue();

      expect(queue).toEqual([]);
    });

    it('추가된 항목 반환', () => {
      addToSyncQueue('CREATE_MEAL', { name: 'meal1' });
      addToSyncQueue('CREATE_WATER', { amount: 200 });

      const queue = getSyncQueue();

      expect(queue.length).toBe(2);
    });
  });

  describe('getPendingCount', () => {
    it('빈 큐에서 0 반환', () => {
      expect(getPendingCount()).toBe(0);
    });

    it('pending 항목 개수 반환', () => {
      addToSyncQueue('CREATE_MEAL', {});
      addToSyncQueue('CREATE_WATER', {});

      expect(getPendingCount()).toBe(2);
    });

    it('completed 제외', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      addToSyncQueue('CREATE_WATER', {});
      updateSyncItemStatus(item.id, 'completed');

      expect(getPendingCount()).toBe(1);
    });

    it('failed 포함', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      updateSyncItemStatus(item.id, 'failed', 'error');

      expect(getPendingCount()).toBe(1);
    });
  });

  describe('updateSyncItemStatus', () => {
    it('상태 업데이트', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      updateSyncItemStatus(item.id, 'syncing');

      const queue = getSyncQueue();
      const updated = queue.find((i) => i.id === item.id);

      expect(updated?.status).toBe('syncing');
    });

    it('에러 메시지 저장', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      updateSyncItemStatus(item.id, 'failed', 'Network error');

      const queue = getSyncQueue();
      const updated = queue.find((i) => i.id === item.id);

      expect(updated?.error).toBe('Network error');
    });

    it('lastAttempt 업데이트', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      const before = Date.now();
      updateSyncItemStatus(item.id, 'syncing');

      const queue = getSyncQueue();
      const updated = queue.find((i) => i.id === item.id);

      expect(updated?.lastAttempt).toBeGreaterThanOrEqual(before);
    });

    it('failed 시 retryCount 증가', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      updateSyncItemStatus(item.id, 'failed', 'error');

      const queue = getSyncQueue();
      const updated = queue.find((i) => i.id === item.id);

      expect(updated?.retryCount).toBe(1);
    });
  });

  describe('removeCompletedItems', () => {
    it('completed 항목 제거', () => {
      const item1 = addToSyncQueue('CREATE_MEAL', {});
      addToSyncQueue('CREATE_WATER', {});
      updateSyncItemStatus(item1.id, 'completed');

      const removedCount = removeCompletedItems();
      const queue = getSyncQueue();

      expect(removedCount).toBe(1);
      expect(queue.length).toBe(1);
    });

    it('제거된 개수 반환', () => {
      const item1 = addToSyncQueue('CREATE_MEAL', {});
      const item2 = addToSyncQueue('CREATE_WATER', {});
      updateSyncItemStatus(item1.id, 'completed');
      updateSyncItemStatus(item2.id, 'completed');

      const removedCount = removeCompletedItems();

      expect(removedCount).toBe(2);
    });

    it('pending/failed 유지', () => {
      const item1 = addToSyncQueue('CREATE_MEAL', {});
      addToSyncQueue('CREATE_WATER', {});
      updateSyncItemStatus(item1.id, 'failed', 'error');
      // item2는 pending 상태 유지

      removeCompletedItems();
      const queue = getSyncQueue();

      expect(queue.length).toBe(2);
    });
  });

  describe('clearSyncQueue', () => {
    it('모든 항목 제거', () => {
      addToSyncQueue('CREATE_MEAL', {});
      addToSyncQueue('CREATE_WATER', {});
      addToSyncQueue('CREATE_WORKOUT_LOG', {});

      clearSyncQueue();
      const queue = getSyncQueue();

      expect(queue.length).toBe(0);
    });
  });

  describe('SyncActionType', () => {
    it('CREATE_MEAL 타입', () => {
      const item = addToSyncQueue('CREATE_MEAL', {});
      expect(item.type).toBe('CREATE_MEAL');
    });

    it('UPDATE_MEAL 타입', () => {
      const item = addToSyncQueue('UPDATE_MEAL', {});
      expect(item.type).toBe('UPDATE_MEAL');
    });

    it('DELETE_MEAL 타입', () => {
      const item = addToSyncQueue('DELETE_MEAL', {});
      expect(item.type).toBe('DELETE_MEAL');
    });

    it('CREATE_WATER 타입', () => {
      const item = addToSyncQueue('CREATE_WATER', {});
      expect(item.type).toBe('CREATE_WATER');
    });

    it('CREATE_WORKOUT_LOG 타입', () => {
      const item = addToSyncQueue('CREATE_WORKOUT_LOG', {});
      expect(item.type).toBe('CREATE_WORKOUT_LOG');
    });

    it('UPDATE_WORKOUT_LOG 타입', () => {
      const item = addToSyncQueue('UPDATE_WORKOUT_LOG', {});
      expect(item.type).toBe('UPDATE_WORKOUT_LOG');
    });
  });
});
