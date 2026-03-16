'use client';

/**
 * 홈 스트릭/뱃지 위젯
 *
 * 운동/영양 연속 기록과 달성 뱃지를 한눈에 표시
 * @see lib/workout/streak.ts
 * @see lib/nutrition/streak.ts
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Utensils, Award, ChevronRight } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

interface StreakData {
  workoutStreak: number;
  workoutLastDate: string | null;
  nutritionStreak: number;
  nutritionLastDate: string | null;
  totalBadges: number;
}

export default function HomeStreakWidget() {
  const supabase = useClerkSupabaseClient();
  const [data, setData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStreaks(): Promise<void> {
      try {
        // 운동 스트릭 조회
        const { data: workoutStreak } = await supabase
          .from('workout_streaks')
          .select('current_streak, last_workout_date, badges_earned')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 영양 스트릭 조회
        const { data: nutritionStreak } = await supabase
          .from('nutrition_streaks')
          .select('current_streak, last_record_date, badges_earned')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const workoutBadges = (workoutStreak?.badges_earned as string[]) ?? [];
        const nutritionBadges = (nutritionStreak?.badges_earned as string[]) ?? [];

        setData({
          workoutStreak: workoutStreak?.current_streak ?? 0,
          workoutLastDate: workoutStreak?.last_workout_date ?? null,
          nutritionStreak: nutritionStreak?.current_streak ?? 0,
          nutritionLastDate: nutritionStreak?.last_record_date ?? null,
          totalBadges: workoutBadges.length + nutritionBadges.length,
        });
      } catch (error) {
        console.error('[HomeStreakWidget] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreaks();
  }, [supabase]);

  // 스트릭 데이터 없으면 표시하지 않음
  if (isLoading) {
    return (
      <div
        className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 animate-pulse"
        data-testid="home-streak-widget-skeleton"
      >
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (!data || (data.workoutStreak === 0 && data.nutritionStreak === 0 && data.totalBadges === 0)) {
    return null;
  }

  return (
    <div
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4"
      data-testid="home-streak-widget"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">나의 기록</h3>
        <Link
          href="/profile"
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          자세히
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* 운동 스트릭 */}
        <div className="flex flex-col items-center gap-1.5 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-lg font-bold text-foreground">{data.workoutStreak}</span>
          <span className="text-[10px] text-muted-foreground">운동 연속</span>
        </div>

        {/* 영양 스트릭 */}
        <div className="flex flex-col items-center gap-1.5 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <Utensils className="w-5 h-5 text-green-500" />
          <span className="text-lg font-bold text-foreground">{data.nutritionStreak}</span>
          <span className="text-[10px] text-muted-foreground">식단 기록</span>
        </div>

        {/* 뱃지 */}
        <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
          <Award className="w-5 h-5 text-violet-500" />
          <span className="text-lg font-bold text-foreground">{data.totalBadges}</span>
          <span className="text-[10px] text-muted-foreground">획득 뱃지</span>
        </div>
      </div>
    </div>
  );
}
