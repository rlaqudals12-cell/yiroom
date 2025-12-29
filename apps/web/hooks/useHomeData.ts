'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 홈 페이지 데이터 훅
 * - 주간 미션 진행 상황
 * - 오늘 기록 요약 (칼로리, 운동, 물)
 * - 리더보드 순위
 * - 추천 제품/코디
 */

interface Mission {
  id: string;
  title: string;
  progress: number;
  target: number;
  completed: boolean;
}

interface RecordSummary {
  calories: { current: number; target: number };
  workout: { minutes: number; completed: boolean };
  water: { cups: number; target: number };
}

interface RankInfo {
  rank: number;
  change: number; // 순위 변화 (양수: 상승, 음수: 하락)
}

interface HomeData {
  missions: Mission[];
  missionsCompleted: number;
  missionsTotal: number;
  recordSummary: RecordSummary;
  rankInfo: RankInfo;
  userName: string;
}

export function useHomeData() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchHomeData() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        // 병렬로 데이터 조회
        const [nutritionResult, workoutResult, waterResult, rankResult] = await Promise.all([
          // 오늘 영양 요약
          supabase
            .from('daily_nutrition_summary')
            .select('total_calories, target_calories')
            .eq('clerk_user_id', user.id)
            .eq('date', today)
            .single(),

          // 오늘 운동 로그
          supabase
            .from('workout_logs')
            .select('duration_minutes')
            .eq('clerk_user_id', user.id)
            .gte('logged_at', `${today}T00:00:00`)
            .lte('logged_at', `${today}T23:59:59`),

          // 오늘 물 섭취
          supabase
            .from('water_records')
            .select('cups')
            .eq('clerk_user_id', user.id)
            .eq('date', today)
            .single(),

          // 리더보드 순위
          supabase
            .from('leaderboard_cache')
            .select('rank, previous_rank')
            .eq('clerk_user_id', user.id)
            .eq('period', 'weekly')
            .single(),
        ]);

        // 운동 시간 합계
        const totalWorkoutMinutes = workoutResult.data?.reduce(
          (sum, log) => sum + (log.duration_minutes || 0),
          0
        ) || 0;

        // 데이터 구성
        const homeData: HomeData = {
          userName: user.firstName || user.username || '사용자',
          missions: [
            { id: '1', title: '물 8잔 마시기', progress: waterResult.data?.cups || 0, target: 8, completed: (waterResult.data?.cups || 0) >= 8 },
            { id: '2', title: '30분 운동하기', progress: totalWorkoutMinutes, target: 30, completed: totalWorkoutMinutes >= 30 },
            { id: '3', title: '식사 기록하기', progress: nutritionResult.data ? 1 : 0, target: 1, completed: !!nutritionResult.data },
            { id: '4', title: '목표 칼로리 달성', progress: nutritionResult.data?.total_calories || 0, target: nutritionResult.data?.target_calories || 2000, completed: (nutritionResult.data?.total_calories || 0) >= (nutritionResult.data?.target_calories || 2000) },
            { id: '5', title: '스트레칭 5분', progress: 0, target: 1, completed: false },
          ],
          missionsCompleted: 0,
          missionsTotal: 5,
          recordSummary: {
            calories: {
              current: nutritionResult.data?.total_calories || 0,
              target: nutritionResult.data?.target_calories || 2000,
            },
            workout: {
              minutes: totalWorkoutMinutes,
              completed: totalWorkoutMinutes >= 30,
            },
            water: {
              cups: waterResult.data?.cups || 0,
              target: 8,
            },
          },
          rankInfo: {
            rank: rankResult.data?.rank || 0,
            change: (rankResult.data?.previous_rank || 0) - (rankResult.data?.rank || 0),
          },
        };

        // 완료된 미션 수 계산
        homeData.missionsCompleted = homeData.missions.filter((m) => m.completed).length;

        setData(homeData);
      } catch (err) {
        console.error('[useHomeData] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch home data'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchHomeData();
  }, [isLoaded, user, supabase]);

  return { data, isLoading, error };
}
