/**
 * 위젯 동기화 훅
 * 앱 데이터 변경 시 위젯 자동 동기화
 */

import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  saveWidgetData,
  getWidgetData,
  updateWaterIntake,
  updateWorkoutComplete,
  updateCaloriesConsumed,
  updateStreak,
  resetDailyData,
} from './storage';
import { TodaySummaryData } from './types';
import { widgetLogger } from '../utils/logger';

interface UseWidgetSyncOptions {
  // 자동 동기화 활성화
  autoSync?: boolean;
  // 동기화 간격 (ms)
  syncInterval?: number;
}

interface UseWidgetSyncReturn {
  // 전체 데이터 동기화
  syncAll: (data: Partial<TodaySummaryData>) => Promise<void>;
  // 물 섭취 추가
  addWater: (amount: number) => Promise<void>;
  // 운동 완료
  completeWorkout: (minutes: number, calories: number) => Promise<void>;
  // 식사 기록
  addMeal: (calories: number) => Promise<void>;
  // 스트릭 갱신
  setStreak: (streak: number) => Promise<void>;
  // 일일 리셋
  resetDaily: () => Promise<void>;
  // 현재 데이터 조회
  getData: () => Promise<TodaySummaryData>;
}

/**
 * 위젯 동기화 훅
 * 앱 데이터 변경 시 위젯으로 자동 전파
 */
export function useWidgetSync(
  options: UseWidgetSyncOptions = {}
): UseWidgetSyncReturn {
  const { autoSync = true, syncInterval = 60000 } = options;

  // 앱 상태 변경 시 동기화
  useEffect(() => {
    if (!autoSync) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      // 앱이 백그라운드로 갈 때 동기화
      if (nextState === 'background') {
        widgetLogger.info('App going to background, syncing...');
        // 현재 데이터 저장 (위젯 갱신 트리거)
        const data = await getWidgetData();
        await saveWidgetData(data);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [autoSync]);

  // 주기적 동기화
  useEffect(() => {
    if (!autoSync || syncInterval <= 0) return;

    const interval = setInterval(async () => {
      widgetLogger.info('Periodic sync...');
      const data = await getWidgetData();
      await saveWidgetData(data);
    }, syncInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoSync, syncInterval]);

  // 전체 데이터 동기화
  const syncAll = useCallback(async (data: Partial<TodaySummaryData>) => {
    await saveWidgetData(data);
  }, []);

  // 물 섭취 추가
  const addWater = useCallback(async (amount: number) => {
    await updateWaterIntake(amount);
  }, []);

  // 운동 완료
  const completeWorkout = useCallback(
    async (minutes: number, calories: number) => {
      await updateWorkoutComplete(minutes, calories);
    },
    []
  );

  // 식사 기록
  const addMeal = useCallback(async (calories: number) => {
    await updateCaloriesConsumed(calories);
  }, []);

  // 스트릭 갱신
  const setStreak = useCallback(async (streak: number) => {
    await updateStreak(streak);
  }, []);

  // 일일 리셋
  const resetDaily = useCallback(async () => {
    await resetDailyData();
  }, []);

  // 현재 데이터 조회
  const getData = useCallback(async () => {
    return await getWidgetData();
  }, []);

  return {
    syncAll,
    addWater,
    completeWorkout,
    addMeal,
    setStreak,
    resetDaily,
    getData,
  };
}
