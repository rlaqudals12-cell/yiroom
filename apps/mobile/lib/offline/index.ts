/**
 * 오프라인 모듈
 * 네트워크 상태 모니터링, 데이터 캐싱, 동기화 큐
 */

// 타입
export * from './types';

// 훅
export { useNetworkStatus } from './useNetworkStatus';
export { useOffline } from './useOffline';

// 캐시
export {
  setCache,
  getCache,
  removeCache,
  getCacheMetadata,
  hasCache,
  isCacheValid,
  clearCacheByPrefix,
  clearAllCache,
  getCacheOrFetch,
} from './cache';

// 동기화 큐
export {
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
} from './syncQueue';
