/**
 * 오프라인 통합 훅
 * 네트워크 상태, 캐싱, 동기화를 통합 관리
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { getSyncQueueCount, processSyncQueue } from './syncQueue';
import { OfflineState, SyncStatus, SyncQueueItem } from './types';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineLogger } from '../utils/logger';

interface UseOfflineOptions {
  // 자동 동기화 활성화
  autoSync?: boolean;
  // 동기화 처리 함수
  syncProcessor?: (item: SyncQueueItem) => Promise<boolean>;
}

interface UseOfflineReturn extends OfflineState {
  // 수동 동기화 실행
  sync: () => Promise<void>;
  // 네트워크 상태 새로고침
  refreshNetwork: () => Promise<void>;
}

/**
 * 오프라인 통합 훅
 */
export function useOffline(options: UseOfflineOptions = {}): UseOfflineReturn {
  const { autoSync = true, syncProcessor } = options;
  const {
    status: networkStatus,
    isConnected,
    refresh: refreshNetwork,
  } = useNetworkStatus();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 대기 항목 수 조회
  const updatePendingCount = useCallback(async () => {
    const count = await getSyncQueueCount();
    setPendingCount(count);
    return count;
  }, []);

  // 동기화 실행
  const sync = useCallback(async () => {
    if (!isConnected || !syncProcessor) {
      offlineLogger.info('Cannot sync: not connected or no processor');
      return;
    }

    const count = await updatePendingCount();
    if (count === 0) {
      offlineLogger.info('Nothing to sync');
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    offlineLogger.info('Starting sync...');

    try {
      const result = await processSyncQueue(syncProcessor);
      setLastSyncAt(new Date().toISOString());

      if (result.failed > 0) {
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }

      await updatePendingCount();
    } catch (error) {
      offlineLogger.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isConnected, syncProcessor, updatePendingCount]);

  // 초기화
  useEffect(() => {
    const init = async () => {
      await updatePendingCount();
      setIsHydrated(true);
    };
    init();
  }, [updatePendingCount]);

  // 대기 항목 있으면 pending 상태로
  useEffect(() => {
    if (pendingCount > 0 && syncStatus === 'synced') {
      setSyncStatus('pending');
    }
  }, [pendingCount, syncStatus]);

  // 온라인 복귀 시 자동 동기화
  useEffect(() => {
    if (autoSync && isConnected && syncStatus === 'pending') {
      offlineLogger.info('Online detected, auto-syncing...');
      sync();
    }
  }, [autoSync, isConnected, syncStatus, sync]);

  // 앱 포그라운드 복귀 시 동기화
  useEffect(() => {
    if (!autoSync) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isConnected && pendingCount > 0) {
        offlineLogger.info('App active, syncing...');
        sync();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [autoSync, isConnected, pendingCount, sync]);

  return {
    networkStatus,
    syncStatus,
    pendingCount,
    lastSyncAt,
    isHydrated,
    sync,
    refreshNetwork,
  };
}
