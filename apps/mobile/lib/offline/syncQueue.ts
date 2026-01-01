/**
 * 동기화 큐 관리
 * 오프라인 변경 사항 저장 및 온라인 시 동기화
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { SyncQueueItem, CACHE_KEYS, MAX_SYNC_RETRIES } from './types';

/**
 * 동기화 큐에 항목 추가
 */
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>
): Promise<string> {
  try {
    const queue = await getSyncQueue();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newItem: SyncQueueItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(newItem);
    await AsyncStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

    console.log('[SyncQueue] Added:', newItem.type, newItem.action);
    return id;
  } catch (error) {
    console.error('[SyncQueue] Failed to add item:', error);
    throw error;
  }
}

/**
 * 동기화 큐 조회
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[SyncQueue] Failed to get queue:', error);
    return [];
  }
}

/**
 * 동기화 큐에서 항목 제거
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    console.log('[SyncQueue] Removed:', id);
  } catch (error) {
    console.error('[SyncQueue] Failed to remove item:', error);
  }
}

/**
 * 동기화 큐 항목 재시도 횟수 증가
 */
export async function incrementRetryCount(
  id: string,
  error?: string
): Promise<boolean> {
  try {
    const queue = await getSyncQueue();
    const index = queue.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    queue[index].retryCount += 1;
    queue[index].lastError = error;

    // 최대 재시도 초과 시 제거
    if (queue[index].retryCount >= MAX_SYNC_RETRIES) {
      console.log('[SyncQueue] Max retries exceeded, removing:', id);
      queue.splice(index, 1);
    }

    await AsyncStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return queue[index]?.retryCount < MAX_SYNC_RETRIES;
  } catch (error) {
    console.error('[SyncQueue] Failed to increment retry:', error);
    return false;
  }
}

/**
 * 동기화 큐 개수 조회
 */
export async function getSyncQueueCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}

/**
 * 동기화 큐 비우기
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.SYNC_QUEUE);
    console.log('[SyncQueue] Cleared');
  } catch (error) {
    console.error('[SyncQueue] Failed to clear:', error);
  }
}

/**
 * 동기화 처리
 * 각 항목에 대해 콜백 함수 실행
 */
export async function processSyncQueue(
  processor: (item: SyncQueueItem) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  console.log('[SyncQueue] Processing', queue.length, 'items');

  for (const item of queue) {
    try {
      const result = await processor(item);
      if (result) {
        await removeFromSyncQueue(item.id);
        success++;
      } else {
        await incrementRetryCount(item.id, 'Processor returned false');
        failed++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const shouldRetry = await incrementRetryCount(item.id, errorMessage);
      if (!shouldRetry) {
        console.log('[SyncQueue] Giving up on item:', item.id);
      }
      failed++;
    }
  }

  console.log('[SyncQueue] Processed:', { success, failed });
  return { success, failed };
}

/**
 * 운동 기록 동기화 항목 생성
 */
export function createWorkoutLogSync(
  action: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'> {
  return {
    type: 'workout_log',
    action,
    data,
  };
}

/**
 * 식사 기록 동기화 항목 생성
 */
export function createMealRecordSync(
  action: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'> {
  return {
    type: 'meal_record',
    action,
    data,
  };
}

/**
 * 물 기록 동기화 항목 생성
 */
export function createWaterRecordSync(
  action: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'> {
  return {
    type: 'water_record',
    action,
    data,
  };
}
