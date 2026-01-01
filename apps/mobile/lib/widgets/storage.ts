/**
 * 위젯 데이터 저장소
 * 앱과 위젯 간 데이터 공유를 위한 유틸리티
 *
 * iOS: App Groups를 통한 UserDefaults 공유
 * Android: SharedPreferences를 통한 데이터 공유
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { TodaySummaryData, DEFAULT_SUMMARY_DATA } from './types';

// 위젯 데이터 키
const WIDGET_DATA_KEY = '@yiroom_widget_data';
const WIDGET_LAST_SYNC_KEY = '@yiroom_widget_last_sync';

// App Group Identifier (iOS)
export const APP_GROUP_ID = 'group.com.yiroom.app';

/**
 * 위젯 데이터 저장
 * 앱에서 데이터 변경 시 호출하여 위젯과 동기화
 */
export async function saveWidgetData(
  data: Partial<TodaySummaryData>
): Promise<void> {
  try {
    const existingData = await getWidgetData();
    const updatedData: TodaySummaryData = {
      ...existingData,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updatedData));
    await AsyncStorage.setItem(WIDGET_LAST_SYNC_KEY, new Date().toISOString());

    // 네이티브 위젯 갱신 트리거 (추후 네이티브 모듈 연동)
    if (Platform.OS === 'ios') {
      // iOS WidgetKit 갱신 요청
      // WidgetKit.reloadAllTimelines();
    } else if (Platform.OS === 'android') {
      // Android AppWidgetManager 갱신 요청
      // AppWidgetManager.updateAppWidget();
    }

    console.log('[Widget] Data saved:', updatedData);
  } catch (error) {
    console.error('[Widget] Failed to save data:', error);
  }
}

/**
 * 위젯 데이터 조회
 */
export async function getWidgetData(): Promise<TodaySummaryData> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (data) {
      return JSON.parse(data) as TodaySummaryData;
    }
    return DEFAULT_SUMMARY_DATA;
  } catch (error) {
    console.error('[Widget] Failed to get data:', error);
    return DEFAULT_SUMMARY_DATA;
  }
}

/**
 * 마지막 동기화 시간 조회
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(WIDGET_LAST_SYNC_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('[Widget] Failed to get last sync time:', error);
    return null;
  }
}

/**
 * 물 섭취 업데이트
 */
export async function updateWaterIntake(amount: number): Promise<void> {
  const data = await getWidgetData();
  await saveWidgetData({
    waterIntake: data.waterIntake + amount,
  });
}

/**
 * 운동 완료 업데이트
 */
export async function updateWorkoutComplete(
  minutes: number,
  calories: number
): Promise<void> {
  await saveWidgetData({
    workoutCompleted: true,
    workoutMinutes: minutes,
    workoutCalories: calories,
  });
}

/**
 * 칼로리 섭취 업데이트
 */
export async function updateCaloriesConsumed(calories: number): Promise<void> {
  const data = await getWidgetData();
  await saveWidgetData({
    caloriesConsumed: data.caloriesConsumed + calories,
  });
}

/**
 * 스트릭 업데이트
 */
export async function updateStreak(streak: number): Promise<void> {
  await saveWidgetData({
    currentStreak: streak,
  });
}

/**
 * 오늘 데이터 리셋 (자정에 호출)
 */
export async function resetDailyData(): Promise<void> {
  const data = await getWidgetData();
  await saveWidgetData({
    waterIntake: 0,
    workoutCompleted: false,
    workoutMinutes: 0,
    workoutCalories: 0,
    caloriesConsumed: 0,
    // 스트릭과 목표는 유지
    currentStreak: data.currentStreak,
    waterGoal: data.waterGoal,
    caloriesGoal: data.caloriesGoal,
  });
}

/**
 * 목표 설정
 */
export async function setGoals(
  waterGoal: number,
  caloriesGoal: number
): Promise<void> {
  await saveWidgetData({
    waterGoal,
    caloriesGoal,
  });
}
