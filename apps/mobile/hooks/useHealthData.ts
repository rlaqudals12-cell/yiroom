/**
 * Apple Health 데이터 훅
 * - 권한 상태 관리
 * - 실시간 데이터 조회
 * - 동기화 제어
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import type { HealthDataSummary, SyncState, SyncResult } from '@/lib/health/types';
import {
  getLocalSyncState,
  enableSync,
  disableSync,
  collectTodayHealthData,
  performSync,
  performMockSync,
  needsSync,
  isHealthDataAvailable,
  getHealthPlatform,
} from '@/lib/health/sync-manager';

interface UseHealthDataResult {
  // 상태
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  platform: 'apple' | 'google' | null;

  // 데이터
  todayData: HealthDataSummary | null;

  // 액션
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
  sync: (authToken?: string) => Promise<SyncResult>;
}

export function useHealthData(): UseHealthDataResult {
  const [isAvailable] = useState(() => isHealthDataAvailable());
  const [platform] = useState(() => getHealthPlatform());
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [todayData, setTodayData] = useState<HealthDataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드
  useEffect(() => {
    async function init() {
      try {
        const state = await getLocalSyncState();
        setSyncState(state);

        if (state.isEnabled && isAvailable) {
          const data = await collectTodayHealthData();
          setTodayData(data);
        }
      } catch (err) {
        console.error('[useHealthData] Init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [isAvailable]);

  // 앱 포그라운드 복귀 시 새로고침
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && syncState?.isEnabled) {
        const shouldSync = await needsSync();
        if (shouldSync) {
          const data = await collectTodayHealthData();
          setTodayData(data);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [syncState?.isEnabled]);

  // 활성화
  const enable = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock 모드 (시뮬레이터)
      if (!isAvailable) {
        await enableSync();
        const state = await getLocalSyncState();
        setSyncState({ ...state, isEnabled: true });

        // Mock 데이터
        setTodayData({
          date: new Date().toISOString().split('T')[0],
          steps: 5234,
          activeCalories: 324,
          heartRate: {
            date: new Date().toISOString().split('T')[0],
            average: 72,
            min: 58,
            max: 132,
            resting: 62,
          },
          sleep: {
            date: new Date().toISOString().split('T')[0],
            totalSleepMinutes: 420,
            inBedMinutes: 480,
            sleepQuality: 'good',
            bedTime: '23:30',
            wakeTime: '07:30',
          },
          weight: 68.5,
          lastUpdated: new Date().toISOString(),
        });
        return true;
      }

      const success = await enableSync();
      if (success) {
        const state = await getLocalSyncState();
        setSyncState(state);

        const data = await collectTodayHealthData();
        setTodayData(data);
      }
      return success;
    } catch (err) {
      console.error('[useHealthData] Enable error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // 비활성화
  const disable = useCallback(async (): Promise<void> => {
    try {
      await disableSync();
      setSyncState((prev) => (prev ? { ...prev, isEnabled: false } : null));
      setTodayData(null);
    } catch (err) {
      console.error('[useHealthData] Disable error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable');
    }
  }, []);

  // 새로고침
  const refresh = useCallback(async (): Promise<void> => {
    if (!syncState?.isEnabled) return;

    setIsLoading(true);
    try {
      const data = await collectTodayHealthData();
      setTodayData(data);
    } catch (err) {
      console.error('[useHealthData] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [syncState?.isEnabled]);

  // 서버 동기화
  const sync = useCallback(
    async (authToken?: string): Promise<SyncResult> => {
      setIsSyncing(true);
      try {
        let result: SyncResult;

        if (!isAvailable || !authToken) {
          // Mock 동기화
          result = await performMockSync();
        } else {
          result = await performSync(authToken);
        }

        if (result.success) {
          const state = await getLocalSyncState();
          setSyncState(state);
        }

        return result;
      } catch (err) {
        console.error('[useHealthData] Sync error:', err);
        return {
          success: false,
          syncedAt: new Date().toISOString(),
          itemsSynced: { steps: 0, calories: 0, heartRate: 0, sleep: 0, workouts: 0 },
          errors: [err instanceof Error ? err.message : 'Sync failed'],
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [isAvailable]
  );

  return {
    isAvailable,
    isEnabled: syncState?.isEnabled ?? false,
    isLoading,
    isSyncing,
    lastSyncTime: syncState?.lastSyncTime ?? null,
    error,
    platform,
    todayData,
    enable,
    disable,
    refresh,
    sync,
  };
}

export default useHealthData;
