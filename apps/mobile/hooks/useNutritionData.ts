/**
 * 영양 데이터 조회 Hook
 * 영양 설정, 일일 요약, 스트릭 정보를 가져옴
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { nutritionLogger } from '../lib/utils/logger';

export interface NutritionSettings {
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number;
  mealCount: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number;
  mealCount: number;
}

export interface NutritionStreak {
  currentStreak: number;
  longestStreak: number;
  lastRecordDate: string | null;
  isActive: boolean;
}

interface UseNutritionDataReturn {
  settings: NutritionSettings | null;
  todaySummary: DailyNutritionSummary | null;
  streak: NutritionStreak | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// 기본 영양 설정 (BMR 2000kcal 기준)
const DEFAULT_SETTINGS: NutritionSettings = {
  dailyCalorieGoal: 2000,
  proteinGoal: 100,
  carbsGoal: 250,
  fatGoal: 65,
  waterGoal: 2000,
  mealCount: 3,
};

export function useNutritionData(): UseNutritionDataReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [settings, setSettings] = useState<NutritionSettings | null>(null);
  const [todaySummary, setTodaySummary] =
    useState<DailyNutritionSummary | null>(null);
  const [streak, setStreak] = useState<NutritionStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNutritionData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 영양 설정
      const { data: settingsData } = await supabase
        .from('nutrition_settings')
        .select(
          'daily_calorie_goal, protein_goal, carbs_goal, fat_goal, water_goal, meal_count'
        )
        .single();

      if (settingsData) {
        setSettings({
          dailyCalorieGoal: settingsData.daily_calorie_goal,
          proteinGoal: settingsData.protein_goal,
          carbsGoal: settingsData.carbs_goal,
          fatGoal: settingsData.fat_goal,
          waterGoal: settingsData.water_goal,
          mealCount: settingsData.meal_count,
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }

      // 오늘 영양 요약
      const today = new Date().toISOString().split('T')[0];
      const { data: summaryData } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('date', today)
        .single();

      if (summaryData) {
        setTodaySummary({
          date: summaryData.date,
          totalCalories: summaryData.total_calories || 0,
          totalProtein: summaryData.total_protein || 0,
          totalCarbs: summaryData.total_carbs || 0,
          totalFat: summaryData.total_fat || 0,
          waterIntake: summaryData.water_intake || 0,
          mealCount: summaryData.meal_count || 0,
        });
      } else {
        setTodaySummary({
          date: today,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          waterIntake: 0,
          mealCount: 0,
        });
      }

      // 영양 스트릭
      const { data: streakData } = await supabase
        .from('nutrition_streaks')
        .select('current_streak, longest_streak, last_record_date')
        .single();

      if (streakData) {
        const lastDate = streakData.last_record_date;
        const isActive = lastDate === today || isYesterday(lastDate);

        setStreak({
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          lastRecordDate: lastDate,
          isActive,
        });
      } else {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastRecordDate: null,
          isActive: false,
        });
      }
    } catch (err) {
      // AbortError는 정상적인 취소이므로 무시
      if (err instanceof Error && err.name === 'AbortError') return;
      nutritionLogger.error('Failed to fetch nutrition data:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch nutrition data')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // supabase 제거 - 클라이언트는 안정적

  useEffect(() => {
    if (!isLoaded) return;

    let isMounted = true;

    const fetch = async () => {
      await fetchNutritionData();
      if (!isMounted) return;
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, fetchNutritionData]);

  return {
    settings,
    todaySummary,
    streak,
    isLoading,
    error,
    refetch: fetchNutritionData,
  };
}

// 헬퍼 함수
function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

// 칼로리 진행률 계산
export function calculateCalorieProgress(
  current: number,
  goal: number
): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

// 영양소 상태 (눔 스타일 신호등)
export type NutrientStatus = 'low' | 'good' | 'high';

export function getNutrientStatus(
  current: number,
  goal: number
): NutrientStatus {
  const ratio = current / goal;
  if (ratio < 0.8) return 'low';
  if (ratio <= 1.1) return 'good';
  return 'high';
}

export function getNutrientStatusColor(status: NutrientStatus): string {
  const colors = {
    low: '#f59e0b', // 노랑
    good: '#22c55e', // 초록
    high: '#ef4444', // 빨강
  };
  return colors[status];
}
