/**
 * 월간 리포트 훅
 * Supabase에서 이번 달 전체 운동/영양 데이터를 조회하여 월간 리포트 생성
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { useNutritionData } from './useNutritionData';
import { aggregateMonthlyReport } from '../lib/reports';
import type { MonthlyReport } from '../lib/reports';
import type { WorkoutLog } from './useWorkoutData';
import type { DailyNutritionSummary } from './useNutritionData';

interface UseMonthlyReportReturn {
  report: MonthlyReport | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMonthlyReport(): UseMonthlyReportReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const { settings } = useNutritionData();

  const [monthlyWorkoutLogs, setMonthlyWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [monthlyNutritionLogs, setMonthlyNutritionLogs] = useState<DailyNutritionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMonthlyData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = lastDay.toISOString().split('T')[0];

      // 운동 로그 (이번 달 전체)
      const { data: workoutData } = await supabase
        .from('workout_logs')
        .select('id, workout_date, completed_at, actual_duration, actual_calories, perceived_effort')
        .gte('workout_date', startStr)
        .lte('workout_date', endStr)
        .order('workout_date', { ascending: true });

      if (workoutData) {
        setMonthlyWorkoutLogs(
          workoutData.map((log) => ({
            id: log.id,
            workoutDate: log.workout_date,
            completedAt: log.completed_at,
            actualDuration: log.actual_duration || 0,
            actualCalories: log.actual_calories || 0,
            perceivedEffort: log.perceived_effort,
          }))
        );
      }

      // 영양 로그 (이번 달 전체)
      const { data: nutritionData } = await supabase
        .from('daily_nutrition_summary')
        .select('date, total_calories, total_protein, total_carbs, total_fat, water_intake, meal_count')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

      if (nutritionData) {
        setMonthlyNutritionLogs(
          nutritionData.map((row) => ({
            date: row.date,
            totalCalories: row.total_calories || 0,
            totalProtein: row.total_protein || 0,
            totalCarbs: row.total_carbs || 0,
            totalFat: row.total_fat || 0,
            waterIntake: row.water_intake || 0,
            mealCount: row.meal_count || 0,
          }))
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('월간 데이터 조회 실패'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchMonthlyData();
  }, [isLoaded, fetchMonthlyData]);

  const report = useMemo(() => {
    if (isLoading) return null;
    return aggregateMonthlyReport(monthlyWorkoutLogs, monthlyNutritionLogs, settings);
  }, [monthlyWorkoutLogs, monthlyNutritionLogs, settings, isLoading]);

  return { report, isLoading, error, refetch: fetchMonthlyData };
}
