/**
 * 오프라인 동기화 큐
 * Sprint F Day 12: 오프라인 지원
 *
 * 오프라인 상태에서 발생한 데이터 변경을 저장하고,
 * 온라인 상태가 되면 서버와 동기화합니다.
 */

// ============================================================
// 타입 정의
// ============================================================

/** 동기화 작업 타입 */
export type SyncActionType =
  | 'CREATE_MEAL'
  | 'UPDATE_MEAL'
  | 'DELETE_MEAL'
  | 'CREATE_WATER'
  | 'CREATE_WORKOUT_LOG'
  | 'UPDATE_WORKOUT_LOG';

/** 동기화 작업 상태 */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

/** 동기화 작업 항목 */
export interface SyncQueueItem {
  id: string;
  type: SyncActionType;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  createdAt: number;
  lastAttempt: number | null;
  error: string | null;
}

/** 동기화 결과 */
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================================
// 상수
// ============================================================

const STORAGE_KEY = 'yiroom_sync_queue';
const MAX_RETRY_COUNT = 3;
const _RETRY_DELAY_MS = 5000;

// ============================================================
// 유틸리티 함수
// ============================================================

/** UUID 생성 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** localStorage에서 큐 로드 */
function loadQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.error('[SyncQueue] Failed to load queue from localStorage');
    return [];
  }
}

/** localStorage에 큐 저장 */
function saveQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    console.error('[SyncQueue] Failed to save queue to localStorage');
  }
}

// ============================================================
// 큐 관리 함수
// ============================================================

/**
 * 동기화 큐에 작업 추가
 */
export function addToSyncQueue(
  type: SyncActionType,
  payload: Record<string, unknown>
): SyncQueueItem {
  const queue = loadQueue();

  const item: SyncQueueItem = {
    id: generateId(),
    type,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
    lastAttempt: null,
    error: null,
  };

  queue.push(item);
  saveQueue(queue);

  console.log('[SyncQueue] Added item:', item.id, type);
  return item;
}

/**
 * 동기화 큐 조회
 */
export function getSyncQueue(): SyncQueueItem[] {
  return loadQueue();
}

/**
 * 대기 중인 작업 개수
 */
export function getPendingCount(): number {
  const queue = loadQueue();
  return queue.filter((item) => item.status === 'pending' || item.status === 'failed').length;
}

/**
 * 특정 항목 상태 업데이트
 */
export function updateSyncItemStatus(
  id: string,
  status: SyncStatus,
  error?: string
): void {
  const queue = loadQueue();
  const index = queue.findIndex((item) => item.id === id);

  if (index !== -1) {
    queue[index] = {
      ...queue[index],
      status,
      lastAttempt: Date.now(),
      error: error || null,
      retryCount: status === 'failed' ? queue[index].retryCount + 1 : queue[index].retryCount,
    };
    saveQueue(queue);
  }
}

/**
 * 완료된 항목 제거
 */
export function removeCompletedItems(): number {
  const queue = loadQueue();
  const filteredQueue = queue.filter((item) => item.status !== 'completed');
  const removedCount = queue.length - filteredQueue.length;
  saveQueue(filteredQueue);
  return removedCount;
}

/**
 * 동기화 큐 초기화
 */
export function clearSyncQueue(): void {
  saveQueue([]);
  console.log('[SyncQueue] Queue cleared');
}

// ============================================================
// 동기화 실행
// ============================================================

/** 작업 타입별 API 엔드포인트 매핑 */
const API_ENDPOINTS: Record<SyncActionType, { method: string; url: string }> = {
  CREATE_MEAL: { method: 'POST', url: '/api/nutrition/meals' },
  UPDATE_MEAL: { method: 'PUT', url: '/api/nutrition/meals' },
  DELETE_MEAL: { method: 'DELETE', url: '/api/nutrition/meals' },
  CREATE_WATER: { method: 'POST', url: '/api/nutrition/water' },
  CREATE_WORKOUT_LOG: { method: 'POST', url: '/api/workout/logs' },
  UPDATE_WORKOUT_LOG: { method: 'PUT', url: '/api/workout/logs' },
};

/**
 * 단일 항목 동기화 시도
 */
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  const endpoint = API_ENDPOINTS[item.type];
  if (!endpoint) {
    console.error('[SyncQueue] Unknown action type:', item.type);
    return false;
  }

  try {
    updateSyncItemStatus(item.id, 'syncing');

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.payload),
    });

    if (response.ok) {
      updateSyncItemStatus(item.id, 'completed');
      console.log('[SyncQueue] Synced successfully:', item.id);
      return true;
    } else {
      const errorText = await response.text();
      updateSyncItemStatus(item.id, 'failed', `HTTP ${response.status}: ${errorText}`);
      console.error('[SyncQueue] Sync failed:', item.id, response.status);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateSyncItemStatus(item.id, 'failed', errorMessage);
    console.error('[SyncQueue] Sync error:', item.id, errorMessage);
    return false;
  }
}

/**
 * 전체 큐 동기화 실행
 */
export async function processSyncQueue(): Promise<SyncResult> {
  // 오프라인이면 즉시 반환
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
  }

  const queue = loadQueue();
  const pendingItems = queue.filter(
    (item) =>
      (item.status === 'pending' || item.status === 'failed') &&
      item.retryCount < MAX_RETRY_COUNT
  );

  if (pendingItems.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  console.log('[SyncQueue] Processing', pendingItems.length, 'items');

  let syncedCount = 0;
  let failedCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const item of pendingItems) {
    const success = await syncItem(item);

    if (success) {
      syncedCount++;
    } else {
      failedCount++;
      const updatedQueue = loadQueue();
      const updatedItem = updatedQueue.find((i) => i.id === item.id);
      if (updatedItem?.error) {
        errors.push({ id: item.id, error: updatedItem.error });
      }
    }

    // 요청 간 딜레이
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 완료된 항목 정리
  removeCompletedItems();

  console.log('[SyncQueue] Completed:', syncedCount, 'synced,', failedCount, 'failed');

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors,
  };
}

// ============================================================
// 자동 동기화 설정
// ============================================================

let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * 자동 동기화 시작
 */
export function startAutoSync(intervalMs: number = 30000): void {
  if (typeof window === 'undefined') return;

  // 기존 인터벌 정리
  stopAutoSync();

  // 온라인 이벤트에서 즉시 동기화
  const handleOnline = () => {
    console.log('[SyncQueue] Online detected, syncing...');
    processSyncQueue();
  };

  window.addEventListener('online', handleOnline);

  // 주기적 동기화
  syncIntervalId = setInterval(() => {
    if (navigator.onLine && getPendingCount() > 0) {
      processSyncQueue();
    }
  }, intervalMs);

  console.log('[SyncQueue] Auto-sync started');
}

/**
 * 자동 동기화 중지
 */
export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('[SyncQueue] Auto-sync stopped');
  }
}

// ============================================================
// Export
// ============================================================

const syncQueueModule = {
  addToSyncQueue,
  getSyncQueue,
  getPendingCount,
  updateSyncItemStatus,
  removeCompletedItems,
  clearSyncQueue,
  processSyncQueue,
  startAutoSync,
  stopAutoSync,
};

export default syncQueueModule;
