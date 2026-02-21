/**
 * 위젯 데이터 제공자
 * 각 위젯 타입별 데이터 수집 및 포맷팅
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  WidgetType,
  WidgetSize,
  DailySummaryWidgetData,
  WorkoutProgressWidgetData,
  NutritionTrackerWidgetData,
  WellnessScoreWidgetData,
  QuickActionsWidgetData,
  AnyWidgetData,
} from './types';
import { widgetLogger } from '../utils/logger';

const WIDGET_DATA_KEY = '@yiroom/widget_data';

/**
 * 위젯 데이터 저장
 */
export async function saveWidgetData(data: AnyWidgetData): Promise<void> {
  try {
    const key = `${WIDGET_DATA_KEY}_${data.type}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    widgetLogger.error(' Failed to save widget data:', error);
  }
}

/**
 * 위젯 데이터 조회
 */
export async function getWidgetData<T extends AnyWidgetData>(type: WidgetType): Promise<T | null> {
  try {
    const key = `${WIDGET_DATA_KEY}_${type}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    widgetLogger.error(' Failed to get widget data:', error);
    return null;
  }
}

/**
 * 일일 요약 위젯 데이터 생성
 */
export async function generateDailySummaryData(
  size: WidgetSize = 'medium'
): Promise<DailySummaryWidgetData> {
  // TODO: 실제 데이터 연동
  // 현재는 Mock 데이터
  const today = new Date().toISOString().split('T')[0];

  return {
    type: 'daily-summary',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      date: today,
      steps: Math.floor(Math.random() * 8000) + 2000,
      stepsGoal: 10000,
      calories: Math.floor(Math.random() * 400) + 200,
      caloriesGoal: 500,
      water: Math.floor(Math.random() * 1500) + 500,
      waterGoal: 2000,
      workoutMinutes: Math.floor(Math.random() * 45) + 15,
      workoutGoal: 60,
      wellnessScore: Math.floor(Math.random() * 30) + 60,
    },
  };
}

/**
 * 운동 진행 위젯 데이터 생성
 */
export async function generateWorkoutProgressData(
  size: WidgetSize = 'small'
): Promise<WorkoutProgressWidgetData> {
  // TODO: 실제 데이터 연동
  return {
    type: 'workout-progress',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      weeklyMinutes: Math.floor(Math.random() * 180) + 60,
      weeklyGoal: 300,
      streak: Math.floor(Math.random() * 10) + 1,
      nextWorkout: {
        name: '상체 운동',
        scheduledAt: null,
      },
      todayCompleted: Math.random() > 0.5,
    },
  };
}

/**
 * 영양 트래커 위젯 데이터 생성
 */
export async function generateNutritionTrackerData(
  size: WidgetSize = 'medium'
): Promise<NutritionTrackerWidgetData> {
  // TODO: 실제 데이터 연동
  return {
    type: 'nutrition-tracker',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      calories: {
        consumed: Math.floor(Math.random() * 1500) + 500,
        goal: 2000,
      },
      macros: {
        carbs: { current: Math.floor(Math.random() * 200) + 100, goal: 300 },
        protein: { current: Math.floor(Math.random() * 80) + 40, goal: 120 },
        fat: { current: Math.floor(Math.random() * 50) + 30, goal: 80 },
      },
      water: {
        current: Math.floor(Math.random() * 1500) + 500,
        goal: 2000,
      },
      mealsLogged: Math.floor(Math.random() * 3) + 1,
    },
  };
}

/**
 * 웰니스 스코어 위젯 데이터 생성
 */
export async function generateWellnessScoreData(
  size: WidgetSize = 'small'
): Promise<WellnessScoreWidgetData> {
  // TODO: 실제 데이터 연동
  const score = Math.floor(Math.random() * 30) + 60;

  return {
    type: 'wellness-score',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      overallScore: score,
      breakdown: {
        activity: Math.floor(Math.random() * 30) + 60,
        nutrition: Math.floor(Math.random() * 30) + 60,
        sleep: Math.floor(Math.random() * 30) + 60,
        mindfulness: Math.floor(Math.random() * 30) + 60,
      },
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      weeklyChange: Math.floor(Math.random() * 10) - 5,
    },
  };
}

/**
 * 빠른 액션 위젯 데이터 생성
 */
export async function generateQuickActionsData(
  size: WidgetSize = 'small'
): Promise<QuickActionsWidgetData> {
  return {
    type: 'quick-actions',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      actions: [
        {
          id: 'log-meal',
          icon: '🍽️',
          label: '식사 기록',
          deepLink: 'yiroom://nutrition/log',
        },
        {
          id: 'start-workout',
          icon: '💪',
          label: '운동 시작',
          deepLink: 'yiroom://workout/start',
        },
        {
          id: 'log-water',
          icon: '💧',
          label: '물 마시기',
          deepLink: 'yiroom://nutrition/water',
        },
        {
          id: 'check-in',
          icon: '✅',
          label: '체크인',
          deepLink: 'yiroom://checkin',
        },
      ],
    },
  };
}

/**
 * 위젯 타입별 데이터 생성
 */
export async function generateWidgetData(
  type: WidgetType,
  size: WidgetSize
): Promise<AnyWidgetData> {
  switch (type) {
    case 'daily-summary':
      return generateDailySummaryData(size);
    case 'workout-progress':
      return generateWorkoutProgressData(size);
    case 'nutrition-tracker':
      return generateNutritionTrackerData(size);
    case 'wellness-score':
      return generateWellnessScoreData(size);
    case 'quick-actions':
      return generateQuickActionsData(size);
    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}

/**
 * 모든 위젯 데이터 업데이트
 */
export async function updateAllWidgets(): Promise<void> {
  const types: WidgetType[] = [
    'daily-summary',
    'workout-progress',
    'nutrition-tracker',
    'wellness-score',
    'quick-actions',
  ];

  await Promise.all(
    types.map(async (type) => {
      const data = await generateWidgetData(type, 'medium');
      await saveWidgetData(data);
    })
  );

  widgetLogger.info(' All widgets updated');
}
