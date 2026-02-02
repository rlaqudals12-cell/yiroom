/**
 * 운동 데이터 조회 Hook
 * 운동 분석, 플랜, 스트릭 정보를 가져옴
 */
import { useUser } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import { useClerkSupabaseClient } from '../lib/supabase';
import { workoutLogger } from '../lib/utils/logger';

// 운동 타입
export type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

export interface WorkoutAnalysis {
  id: string;
  workoutType: WorkoutType;
  fitnessLevel: string;
  goals: string[];
  createdAt: Date;
}

export interface WorkoutStreak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  isActive: boolean;
}

export interface TodayWorkout {
  planId: string;
  dayOfWeek: number;
  exercises: WorkoutExercise[];
  isCompleted: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  category: string;
}

interface UseWorkoutDataReturn {
  analysis: WorkoutAnalysis | null;
  streak: WorkoutStreak | null;
  todayWorkout: TodayWorkout | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWorkoutData(): UseWorkoutDataReturn {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkoutData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 운동 분석 결과
      const { data: analysisData } = await supabase
        .from('workout_analyses')
        .select('id, workout_type, fitness_level, goals, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analysisData) {
        setAnalysis({
          id: analysisData.id,
          workoutType: analysisData.workout_type as WorkoutType,
          fitnessLevel: analysisData.fitness_level,
          goals: analysisData.goals || [],
          createdAt: new Date(analysisData.created_at),
        });
      }

      // 운동 스트릭
      const { data: streakData } = await supabase
        .from('workout_streaks')
        .select('current_streak, longest_streak, last_workout_date')
        .single();

      if (streakData) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = streakData.last_workout_date;
        const isActive = lastDate === today || isYesterday(lastDate);

        setStreak({
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          lastWorkoutDate: lastDate,
          isActive,
        });
      } else {
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastWorkoutDate: null,
          isActive: false,
        });
      }

      // 오늘의 운동 플랜
      const dayOfWeek = new Date().getDay(); // 0-6
      const { data: planData } = await supabase
        .from('workout_plans')
        .select('id, weekly_plan')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planData?.weekly_plan) {
        const weeklyPlan = planData.weekly_plan as Record<string, unknown>;
        const dayKey = getDayKey(dayOfWeek);
        const todayPlan = weeklyPlan[dayKey] as
          | { exercises?: unknown[] }
          | undefined;

        if (todayPlan?.exercises) {
          setTodayWorkout({
            planId: planData.id,
            dayOfWeek,
            exercises: (todayPlan.exercises as unknown[]).map((ex: unknown) => {
              const exercise = ex as Record<string, unknown>;
              return {
                id: String(exercise.id || ''),
                name: String(exercise.name || ''),
                sets: Number(exercise.sets || 3),
                reps: Number(exercise.reps || 10),
                duration: exercise.duration
                  ? Number(exercise.duration)
                  : undefined,
                category: String(exercise.category || ''),
              };
            }),
            isCompleted: false,
          });
        }
      }
    } catch (err) {
      // AbortError는 정상적인 취소이므로 무시
      if (err instanceof Error && err.name === 'AbortError') return;
      workoutLogger.error('Failed to fetch workout data:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch workout data')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    if (!isLoaded) return;

    let isMounted = true;

    const fetch = async () => {
      await fetchWorkoutData();
      if (!isMounted) return;
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, fetchWorkoutData]);

  return {
    analysis,
    streak,
    todayWorkout,
    isLoading,
    error,
    refetch: fetchWorkoutData,
  };
}

// 헬퍼 함수
function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

function getDayKey(dayOfWeek: number): string {
  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[dayOfWeek];
}

// 운동 타입 라벨
export function getWorkoutTypeLabel(type: WorkoutType): string {
  const labels: Record<WorkoutType, string> = {
    toner: '토너',
    builder: '빌더',
    burner: '버너',
    mover: '무버',
    flexer: '플렉서',
  };
  return labels[type];
}

export function getWorkoutTypeDescription(type: WorkoutType): string {
  const descriptions: Record<WorkoutType, string> = {
    toner: '근육 탄력과 라인 정리',
    builder: '근육량 증가와 체력 강화',
    burner: '체지방 감소와 심폐 능력',
    mover: '유연성과 기능성 향상',
    flexer: '스트레칭과 회복 중심',
  };
  return descriptions[type];
}
