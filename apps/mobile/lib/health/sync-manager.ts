/**
 * 건강 데이터 동기화 매니저
 * - Apple Health (iOS) + Google Fit (Android) 통합
 * - 마지막 동기화 시점 관리
 * - 백그라운드 동기화 지원
 * - 서버 API 연동
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SyncState,
  SyncResult,
  HealthDataSummary,
  StepCountData,
  SleepSummary,
  HeartRateSummary,
} from './types';
import {
  isHealthKitAvailable,
  initializeHealthKit,
  getTodaySteps as getAppleSteps,
  getTodayActiveCalories as getAppleCalories,
  getTodayHeartRate as getAppleHeartRate,
  getLastNightSleep as getAppleSleep,
} from './apple-health';
import {
  isGoogleFitAvailable,
  initializeGoogleFit,
  getTodaySteps as getGoogleSteps,
  getTodayActiveCalories as getGoogleCalories,
  getTodayHeartRate as getGoogleHeartRate,
  getLastNightSleep as getGoogleSleep,
} from './google-fit';

const SYNC_STATE_KEY = '@yiroom/health_sync_state';
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15분

// 기본 동기화 상태
const DEFAULT_SYNC_STATE: SyncState = {
  lastSyncTime: null,
  isEnabled: false,
  permissions: { read: [], write: [] },
};

/**
 * 동기화 상태 조회
 */
export async function getLocalSyncState(): Promise<SyncState> {
  try {
    const stored = await AsyncStorage.getItem(SYNC_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[HealthSync] Failed to get sync state:', error);
  }
  return DEFAULT_SYNC_STATE;
}

/**
 * 동기화 상태 저장
 */
export async function setSyncState(state: Partial<SyncState>): Promise<void> {
  try {
    const current = await getLocalSyncState();
    const updated = { ...current, ...state };
    await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[HealthSync] Failed to save sync state:', error);
  }
}

/**
 * 플랫폼별 건강 데이터 가용 여부
 */
export function isHealthDataAvailable(): boolean {
  if (Platform.OS === 'ios') {
    return isHealthKitAvailable();
  } else if (Platform.OS === 'android') {
    return isGoogleFitAvailable();
  }
  return false;
}

/**
 * 플랫폼 타입 반환
 */
export function getHealthPlatform(): 'apple' | 'google' | null {
  if (Platform.OS === 'ios' && isHealthKitAvailable()) return 'apple';
  if (Platform.OS === 'android' && isGoogleFitAvailable()) return 'google';
  return null;
}

/**
 * 동기화 활성화
 */
export async function enableSync(): Promise<boolean> {
  const platform = getHealthPlatform();

  if (platform === 'apple') {
    const initialized = await initializeHealthKit();
    if (!initialized) {
      console.log('[HealthSync] Failed to initialize HealthKit');
      return false;
    }
  } else if (platform === 'google') {
    const initialized = await initializeGoogleFit();
    if (!initialized) {
      console.log('[HealthSync] Failed to initialize Google Fit');
      return false;
    }
  } else {
    console.log('[HealthSync] No health platform available');
    return false;
  }

  await setSyncState({
    isEnabled: true,
    lastSyncTime: new Date().toISOString(),
  });

  return true;
}

/**
 * 동기화 비활성화
 */
export async function disableSync(): Promise<void> {
  await setSyncState({ isEnabled: false });
}

/**
 * 동기화 필요 여부 확인
 */
export async function needsSync(): Promise<boolean> {
  const state = await getLocalSyncState();

  if (!state.isEnabled) return false;
  if (!state.lastSyncTime) return true;

  const lastSync = new Date(state.lastSyncTime).getTime();
  const now = Date.now();

  return now - lastSync > SYNC_INTERVAL_MS;
}

/**
 * 플랫폼별 데이터 조회 함수 선택
 */
function getPlatformFunctions() {
  const platform = getHealthPlatform();

  if (platform === 'apple') {
    return {
      getSteps: getAppleSteps,
      getCalories: getAppleCalories,
      getHeartRate: getAppleHeartRate,
      getSleep: getAppleSleep,
    };
  } else if (platform === 'google') {
    return {
      getSteps: getGoogleSteps,
      getCalories: getGoogleCalories,
      getHeartRate: getGoogleHeartRate,
      getSleep: getGoogleSleep,
    };
  }

  return null;
}

/**
 * 오늘의 건강 데이터 수집
 */
export async function collectTodayHealthData(): Promise<HealthDataSummary | null> {
  const funcs = getPlatformFunctions();

  if (!funcs) {
    return null;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const [steps, calories, heartRate, sleep] = await Promise.all([
      funcs.getSteps(),
      funcs.getCalories(),
      funcs.getHeartRate(),
      funcs.getSleep(),
    ]);

    return {
      date: today,
      steps: steps?.steps ?? 0,
      activeCalories: calories?.calories ?? 0,
      heartRate: heartRate,
      sleep: sleep,
      weight: null, // 별도 조회 필요
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[HealthSync] Failed to collect health data:', error);
    return null;
  }
}

/**
 * 서버로 데이터 동기화
 */
export async function syncToServer(
  data: HealthDataSummary,
  authToken: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    syncedAt: new Date().toISOString(),
    itemsSynced: {
      steps: 0,
      calories: 0,
      heartRate: 0,
      sleep: 0,
      workouts: 0,
    },
    errors: [],
  };

  try {
    // 서버 API 호출
    const response = await fetch('/api/health/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        stepData: data.steps > 0 ? [{ date: data.date, steps: data.steps, source: 'HealthKit' }] : [],
        calorieData:
          data.activeCalories > 0
            ? [{ date: data.date, calories: data.activeCalories, source: 'HealthKit' }]
            : [],
        heartRateData: data.heartRate ? [data.heartRate] : [],
        sleepData: data.sleep ? [data.sleep] : [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Server sync failed: ${response.status}`);
    }

    const serverResult = await response.json();

    result.success = serverResult.success;
    result.itemsSynced = {
      steps: data.steps > 0 ? 1 : 0,
      calories: data.activeCalories > 0 ? 1 : 0,
      heartRate: data.heartRate ? 1 : 0,
      sleep: data.sleep ? 1 : 0,
      workouts: 0,
    };

    // 동기화 시간 업데이트
    await setSyncState({ lastSyncTime: result.syncedAt });
  } catch (error) {
    console.error('[HealthSync] Server sync error:', error);
    result.errors = [error instanceof Error ? error.message : 'Unknown error'];
  }

  return result;
}

/**
 * 전체 동기화 실행
 */
export async function performSync(authToken: string): Promise<SyncResult> {
  const state = await getLocalSyncState();

  if (!state.isEnabled) {
    return {
      success: false,
      syncedAt: new Date().toISOString(),
      itemsSynced: { steps: 0, calories: 0, heartRate: 0, sleep: 0, workouts: 0 },
      errors: ['Sync is disabled'],
    };
  }

  const data = await collectTodayHealthData();

  if (!data) {
    return {
      success: false,
      syncedAt: new Date().toISOString(),
      itemsSynced: { steps: 0, calories: 0, heartRate: 0, sleep: 0, workouts: 0 },
      errors: ['Failed to collect health data'],
    };
  }

  return syncToServer(data, authToken);
}

/**
 * Mock 동기화 (개발/테스트용)
 */
export async function performMockSync(): Promise<SyncResult> {
  // Mock 데이터 생성
  await new Promise((resolve) => setTimeout(resolve, 500));

  const now = new Date().toISOString();

  await setSyncState({ lastSyncTime: now });

  return {
    success: true,
    syncedAt: now,
    itemsSynced: {
      steps: 1,
      calories: 1,
      heartRate: 1,
      sleep: 1,
      workouts: 0,
    },
  };
}
