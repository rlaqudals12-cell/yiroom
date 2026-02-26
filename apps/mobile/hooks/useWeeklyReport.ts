/**
 * 주간 리포트 훅
 * useWorkoutData, useNutritionData를 결합하여 주간 리포트 생성
 */
import { useMemo } from 'react';

import { useWorkoutData } from './useWorkoutData';
import { useNutritionData } from './useNutritionData';
import { aggregateWeeklyReport } from '../lib/reports';
import type { WeeklyReport } from '../lib/reports';

interface UseWeeklyReportReturn {
  report: WeeklyReport | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWeeklyReport(): UseWeeklyReportReturn {
  const {
    weeklyLogs,
    streak,
    isLoading: workoutLoading,
    error: workoutError,
    refetch: workoutRefetch,
  } = useWorkoutData();

  const {
    weeklyHistory,
    settings,
    isLoading: nutritionLoading,
    error: nutritionError,
    refetch: nutritionRefetch,
  } = useNutritionData();

  const isLoading = workoutLoading || nutritionLoading;
  const error = workoutError || nutritionError;

  const report = useMemo(() => {
    if (isLoading) return null;

    return aggregateWeeklyReport(
      weeklyLogs,
      weeklyHistory,
      settings,
      streak?.currentStreak ?? 0
    );
  }, [weeklyLogs, weeklyHistory, settings, streak, isLoading]);

  const refetch = async (): Promise<void> => {
    await Promise.all([workoutRefetch(), nutritionRefetch()]);
  };

  return { report, isLoading, error, refetch };
}
