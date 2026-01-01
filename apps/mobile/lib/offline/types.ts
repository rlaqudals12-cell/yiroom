/**
 * 오프라인 모듈 타입 정의
 */

// 네트워크 상태
export type NetworkStatus = 'online' | 'offline' | 'unknown';

// 동기화 상태
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

// 동기화 대기 항목
export interface SyncQueueItem {
  id: string;
  type: 'workout_log' | 'meal_record' | 'water_record' | 'goal_update';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// 캐시 항목 메타데이터
export interface CacheMetadata {
  key: string;
  expiresAt: string | null; // null = 만료 없음
  updatedAt: string;
  version: number;
}

// 캐시 설정
export interface CacheConfig {
  defaultTTL: number; // 밀리초
  maxItems: number;
  autoCleanup: boolean;
}

// 오프라인 상태
export interface OfflineState {
  networkStatus: NetworkStatus;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncAt: string | null;
  isHydrated: boolean;
}

// 캐시 키 상수
export const CACHE_KEYS = {
  WORKOUT_DATA: '@yiroom_cache_workout',
  NUTRITION_DATA: '@yiroom_cache_nutrition',
  USER_ANALYSES: '@yiroom_cache_analyses',
  PRODUCTS: '@yiroom_cache_products',
  SYNC_QUEUE: '@yiroom_sync_queue',
  OFFLINE_STATE: '@yiroom_offline_state',
} as const;

// 기본 캐시 TTL (1시간)
export const DEFAULT_CACHE_TTL = 60 * 60 * 1000;

// 동기화 재시도 제한
export const MAX_SYNC_RETRIES = 3;
