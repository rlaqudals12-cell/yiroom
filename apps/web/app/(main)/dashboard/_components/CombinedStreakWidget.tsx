'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flame, Dumbbell, Utensils, Sparkles, TrendingUp, Settings } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { DailyCheckin } from '@/components/checkin';
import { getStreakSummary as getWorkoutStreakSummary, type StreakSummary } from '@/lib/workout';
import {
  getStreakSummary as getNutritionStreakSummary,
  type StreakSummary as NutritionStreakSummary,
} from '@/lib/nutrition';
import { loadNotificationSettings, showStreakWarning } from '@/lib/notifications';

interface CombinedStreakWidgetProps {
  userId?: string;
}

/**
 * 통합 Streak 위젯
 * 운동 + 영양 연속 기록 표시 + 일일 체크인 유도
 */
export default function CombinedStreakWidget({ userId }: CombinedStreakWidgetProps) {
  const supabase = useClerkSupabaseClient();
  const [workoutStreak, setWorkoutStreak] = useState<StreakSummary | null>(null);
  const [nutritionStreak, setNutritionStreak] = useState<NutritionStreakSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const hasShownWarning = useRef(false);

  useEffect(() => {
    async function fetchStreaks() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 운동 Streak 데이터 조회
        const { data: workoutData } = await supabase.from('workout_streaks').select('*').single();

        // 영양 Streak 데이터 조회
        const { data: nutritionData } = await supabase
          .from('nutrition_streaks')
          .select('*')
          .single();

        // Streak Summary 계산
        const workoutSummary = getWorkoutStreakSummary(workoutData);
        const nutritionSummary = getNutritionStreakSummary(
          nutritionData
            ? {
                id: nutritionData.id,
                userId: nutritionData.user_id,
                currentStreak: nutritionData.current_streak,
                longestStreak: nutritionData.longest_streak,
                lastRecordDate: nutritionData.last_record_date,
                badgesEarned: nutritionData.badges_earned || [],
                premiumRewardsClaimed: nutritionData.premium_rewards_claimed || [],
                updatedAt: nutritionData.updated_at,
              }
            : null
        );

        setWorkoutStreak(workoutSummary);
        setNutritionStreak(nutritionSummary);
      } catch (error) {
        console.error('Streak 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreaks();
  }, [supabase, userId]);

  // Streak 경고 알림 (하루에 한 번만)
  useEffect(() => {
    if (hasShownWarning.current) return;
    if (isLoading) return;

    const settings = loadNotificationSettings();
    if (!settings.enabled || !settings.streakWarning) return;

    // 운동 streak 경고 (활성 상태이고 오늘 기록 안 함)
    if (
      workoutStreak?.isActive &&
      workoutStreak.warningMessage &&
      workoutStreak.currentStreak >= 3
    ) {
      showStreakWarning('workout', workoutStreak.currentStreak);
      hasShownWarning.current = true;
    }

    // 영양 streak 경고 (활성 상태이고 오늘 기록 안 함)
    if (
      nutritionStreak?.isActive &&
      nutritionStreak.warningMessage &&
      nutritionStreak.currentStreak >= 3
    ) {
      showStreakWarning('nutrition', nutritionStreak.currentStreak);
      hasShownWarning.current = true;
    }
  }, [isLoading, workoutStreak, nutritionStreak]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-amber-100 rounded w-1/3 mb-4" />
        <div className="h-16 bg-amber-100 rounded" />
      </div>
    );
  }

  // 유저 없음
  if (!userId) {
    return null;
  }

  const totalStreak = (workoutStreak?.currentStreak || 0) + (nutritionStreak?.currentStreak || 0);
  const isAnyActive = workoutStreak?.isActive || nutritionStreak?.isActive;

  return (
    <>
      <div
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl border border-amber-100 overflow-hidden"
        data-testid="combined-streak-widget"
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">연속 기록</h3>
                <p className="text-sm text-amber-600">
                  {isAnyActive ? '현재 진행 중' : '새로운 기록을 시작해보세요'}
                </p>
              </div>
            </div>

            {/* 설정 + 총 streak 숫자 */}
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                title="알림 설정"
              >
                <Settings className="w-4 h-4 text-amber-600" />
              </Link>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-600">
                  {totalStreak}
                  <span className="text-lg text-muted-foreground">일</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 세부 streak */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {/* 운동 Streak */}
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-module-workout" />
              <span className="text-sm font-medium text-foreground">운동</span>
            </div>
            <p className="text-2xl font-bold text-module-workout">
              {workoutStreak?.currentStreak || 0}
              <span className="text-sm text-muted-foreground">일</span>
            </p>
            {workoutStreak?.isActive && workoutStreak.nextMilestone && (
              <p className="text-xs text-muted-foreground mt-1">
                {workoutStreak.nextMilestone}일까지 {workoutStreak.daysToNextMilestone}일
              </p>
            )}
          </div>

          {/* 영양 Streak */}
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-module-nutrition" />
              <span className="text-sm font-medium text-foreground">영양</span>
            </div>
            <p className="text-2xl font-bold text-module-nutrition">
              {nutritionStreak?.currentStreak || 0}
              <span className="text-sm text-muted-foreground">일</span>
            </p>
            {nutritionStreak?.isActive && nutritionStreak.nextMilestone && (
              <p className="text-xs text-muted-foreground mt-1">
                {nutritionStreak.nextMilestone}일까지 {nutritionStreak.daysToNextMilestone}일
              </p>
            )}
          </div>
        </div>

        {/* 마일스톤 알림 */}
        {(workoutStreak?.daysToNextMilestone === 1 ||
          nutritionStreak?.daysToNextMilestone === 1) && (
          <div className="mx-4 mb-4 bg-amber-100 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">내일이면 마일스톤 달성! 🎉</span>
            </div>
          </div>
        )}

        {/* 체크인 버튼 */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setIsCheckinOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            오늘의 나 체크인하기
          </button>
        </div>
      </div>

      {/* 체크인 모달 */}
      <DailyCheckin open={isCheckinOpen} onOpenChange={setIsCheckinOpen} />
    </>
  );
}
