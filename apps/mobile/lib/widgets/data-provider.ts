/**
 * 위젯 데이터 제공자
 * 각 위젯 타입별 데이터 수집 및 포맷팅
 * Supabase 실제 데이터 기반, 오류 시 기본값 반환
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 * Supabase에서 오늘의 운동/영양/웰니스 데이터를 조회합니다.
 */
export async function generateDailySummaryData(
  size: WidgetSize = 'medium',
  supabase?: SupabaseClient,
  userId?: string
): Promise<DailySummaryWidgetData> {
  const today = new Date().toISOString().split('T')[0];
  const defaults = {
    date: today,
    steps: 0,
    stepsGoal: 10000,
    calories: 0,
    caloriesGoal: 500,
    water: 0,
    waterGoal: 2000,
    workoutMinutes: 0,
    workoutGoal: 60,
    wellnessScore: 0,
  };

  if (supabase && userId) {
    try {
      const [workoutRes, nutritionRes, wellnessRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('duration_minutes, calories_burned')
          .eq('clerk_user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase
          .from('daily_nutrition_summary')
          .select('total_calories, water_ml')
          .eq('clerk_user_id', userId)
          .eq('date', today)
          .maybeSingle(),
        supabase
          .from('wellness_scores')
          .select('total')
          .eq('clerk_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const workoutMinutes = (workoutRes.data ?? []).reduce(
        (sum: number, s: { duration_minutes: number }) => sum + (s.duration_minutes ?? 0),
        0
      );
      const calories = (workoutRes.data ?? []).reduce(
        (sum: number, s: { calories_burned: number }) => sum + (s.calories_burned ?? 0),
        0
      );

      defaults.workoutMinutes = workoutMinutes;
      defaults.calories = calories;
      defaults.water = nutritionRes.data?.water_ml ?? 0;
      defaults.wellnessScore = wellnessRes.data?.total ?? 0;
    } catch (error) {
      widgetLogger.error('Failed to fetch daily summary data:', error);
    }
  }

  return {
    type: 'daily-summary',
    size,
    updatedAt: new Date().toISOString(),
    data: defaults,
  };
}

/**
 * 운동 진행 위젯 데이터 생성
 * 이번 주 운동 시간과 연속 기록을 Supabase에서 조회합니다.
 */
export async function generateWorkoutProgressData(
  size: WidgetSize = 'small',
  supabase?: SupabaseClient,
  userId?: string
): Promise<WorkoutProgressWidgetData> {
  let weeklyMinutes = 0;
  let streak = 0;
  let todayCompleted = false;

  if (supabase && userId) {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const today = now.toISOString().split('T')[0];

      const [weeklyRes, todayRes, streakRes] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('duration_minutes')
          .eq('clerk_user_id', userId)
          .gte('created_at', weekStart.toISOString()),
        supabase
          .from('workout_sessions')
          .select('id')
          .eq('clerk_user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .limit(1),
        supabase
          .from('workout_sessions')
          .select('created_at')
          .eq('clerk_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      weeklyMinutes = (weeklyRes.data ?? []).reduce(
        (sum: number, s: { duration_minutes: number }) => sum + (s.duration_minutes ?? 0),
        0
      );
      todayCompleted = (todayRes.data ?? []).length > 0;

      // 연속일 계산
      if (streakRes.data && streakRes.data.length > 0) {
        const dates = new Set(
          streakRes.data.map((s: { created_at: string }) => s.created_at.substring(0, 10))
        );
        for (let i = 0; i < 30; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          if (dates.has(d.toISOString().substring(0, 10))) {
            streak++;
          } else {
            break;
          }
        }
      }
    } catch (error) {
      widgetLogger.error('Failed to fetch workout progress data:', error);
    }
  }

  return {
    type: 'workout-progress',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      weeklyMinutes,
      weeklyGoal: 300,
      streak,
      nextWorkout: {
        name: '상체 운동',
        scheduledAt: null,
      },
      todayCompleted,
    },
  };
}

/**
 * 영양 트래커 위젯 데이터 생성
 */
export async function generateNutritionTrackerData(
  size: WidgetSize = 'medium',
  supabase?: SupabaseClient,
  userId?: string
): Promise<NutritionTrackerWidgetData> {
  const today = new Date().toISOString().split('T')[0];
  const defaults = {
    calories: { consumed: 0, goal: 2000 },
    macros: {
      carbs: { current: 0, goal: 300 },
      protein: { current: 0, goal: 120 },
      fat: { current: 0, goal: 80 },
    },
    water: { current: 0, goal: 2000 },
    mealsLogged: 0,
  };

  if (supabase && userId) {
    try {
      const [summaryRes, mealsRes, settingsRes] = await Promise.all([
        supabase
          .from('daily_nutrition_summary')
          .select('total_calories, total_carbs, total_protein, total_fat, water_ml')
          .eq('clerk_user_id', userId)
          .eq('date', today)
          .maybeSingle(),
        supabase
          .from('meal_records')
          .select('id')
          .eq('clerk_user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`),
        supabase
          .from('nutrition_settings')
          .select('target_calories, target_carbs, target_protein, target_fat, water_goal')
          .eq('clerk_user_id', userId)
          .maybeSingle(),
      ]);

      if (summaryRes.data) {
        defaults.calories.consumed = summaryRes.data.total_calories ?? 0;
        defaults.macros.carbs.current = summaryRes.data.total_carbs ?? 0;
        defaults.macros.protein.current = summaryRes.data.total_protein ?? 0;
        defaults.macros.fat.current = summaryRes.data.total_fat ?? 0;
        defaults.water.current = summaryRes.data.water_ml ?? 0;
      }

      defaults.mealsLogged = (mealsRes.data ?? []).length;

      // 사용자 설정 목표가 있으면 반영
      if (settingsRes.data) {
        defaults.calories.goal = settingsRes.data.target_calories ?? 2000;
        defaults.macros.carbs.goal = settingsRes.data.target_carbs ?? 300;
        defaults.macros.protein.goal = settingsRes.data.target_protein ?? 120;
        defaults.macros.fat.goal = settingsRes.data.target_fat ?? 80;
        defaults.water.goal = settingsRes.data.water_goal ?? 2000;
      }
    } catch (error) {
      widgetLogger.error('Failed to fetch nutrition tracker data:', error);
    }
  }

  return {
    type: 'nutrition-tracker',
    size,
    updatedAt: new Date().toISOString(),
    data: defaults,
  };
}

/**
 * 웰니스 스코어 위젯 데이터 생성
 */
export async function generateWellnessScoreData(
  size: WidgetSize = 'small',
  supabase?: SupabaseClient,
  userId?: string
): Promise<WellnessScoreWidgetData> {
  let overallScore = 0;
  let breakdown = { activity: 0, nutrition: 0, sleep: 0, mindfulness: 0 };
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let weeklyChange = 0;

  if (supabase && userId) {
    try {
      const [latestRes, previousRes] = await Promise.all([
        supabase
          .from('wellness_scores')
          .select('total, activity, nutrition, sleep, mindfulness')
          .eq('clerk_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // 7일 전 점수 (트렌드 비교용)
        supabase
          .from('wellness_scores')
          .select('total')
          .eq('clerk_user_id', userId)
          .lte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (latestRes.data) {
        overallScore = latestRes.data.total ?? 0;
        breakdown = {
          activity: latestRes.data.activity ?? 0,
          nutrition: latestRes.data.nutrition ?? 0,
          sleep: latestRes.data.sleep ?? 0,
          mindfulness: latestRes.data.mindfulness ?? 0,
        };
      }

      if (previousRes.data && latestRes.data) {
        weeklyChange = (latestRes.data.total ?? 0) - (previousRes.data.total ?? 0);
        trend = weeklyChange > 2 ? 'up' : weeklyChange < -2 ? 'down' : 'stable';
      }
    } catch (error) {
      widgetLogger.error('Failed to fetch wellness score data:', error);
    }
  }

  return {
    type: 'wellness-score',
    size,
    updatedAt: new Date().toISOString(),
    data: {
      overallScore,
      breakdown,
      trend,
      weeklyChange,
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
  size: WidgetSize,
  supabase?: SupabaseClient,
  userId?: string
): Promise<AnyWidgetData> {
  switch (type) {
    case 'daily-summary':
      return generateDailySummaryData(size, supabase, userId);
    case 'workout-progress':
      return generateWorkoutProgressData(size, supabase, userId);
    case 'nutrition-tracker':
      return generateNutritionTrackerData(size, supabase, userId);
    case 'wellness-score':
      return generateWellnessScoreData(size, supabase, userId);
    case 'quick-actions':
      return generateQuickActionsData(size);
    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}

/**
 * 모든 위젯 데이터 업데이트
 */
export async function updateAllWidgets(
  supabase?: SupabaseClient,
  userId?: string
): Promise<void> {
  const types: WidgetType[] = [
    'daily-summary',
    'workout-progress',
    'nutrition-tracker',
    'wellness-score',
    'quick-actions',
  ];

  await Promise.all(
    types.map(async (type) => {
      const data = await generateWidgetData(type, 'medium', supabase, userId);
      await saveWidgetData(data);
    })
  );

  widgetLogger.info(' All widgets updated');
}
