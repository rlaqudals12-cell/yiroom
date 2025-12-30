'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Flame,
  Dumbbell,
  Utensils,
  Sparkles,
  TrendingUp,
  Settings,
  Droplets,
  ChevronRight,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { DailyCheckin } from '@/components/checkin';
import { InfoTooltip } from '@/components/common';
import { getStreakSummary as getWorkoutStreakSummary, type StreakSummary } from '@/lib/workout/streak';
import { getStreakSummary as getNutritionStreakSummary, type StreakSummary as NutritionStreakSummary } from '@/lib/nutrition/streak';
import { loadNotificationSettings, showStreakWarning } from '@/lib/notifications';
import type { WeeklyReport } from '@/types/report';

interface TodayFocusWidgetProps {
  userId?: string;
}

/**
 * 오늘의 포커스 위젯 (Hero Section)
 * - 통합 스트릭 표시 (대형 숫자)
 * - 체크인 CTA 버튼
 * - 주간 요약 통계
 */
export default function TodayFocusWidget({ userId }: TodayFocusWidgetProps) {
  const supabase = useClerkSupabaseClient();
  const [workoutStreak, setWorkoutStreak] = useState<StreakSummary | null>(null);
  const [nutritionStreak, setNutritionStreak] = useState<NutritionStreakSummary | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const hasShownWarning = useRef(false);

  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 스트릭 데이터 조회 (maybeSingle: 데이터 없어도 에러 안남)
        const [workoutResult, nutritionResult] = await Promise.all([
          supabase.from('workout_streaks').select('*').maybeSingle(),
          supabase.from('nutrition_streaks').select('*').maybeSingle(),
        ]);

        const workoutSummary = getWorkoutStreakSummary(workoutResult.data);
        const nutritionSummary = getNutritionStreakSummary(nutritionResult.data ? {
          id: nutritionResult.data.id,
          userId: nutritionResult.data.user_id,
          currentStreak: nutritionResult.data.current_streak,
          longestStreak: nutritionResult.data.longest_streak,
          lastRecordDate: nutritionResult.data.last_record_date,
          badgesEarned: nutritionResult.data.badges_earned || [],
          premiumRewardsClaimed: nutritionResult.data.premium_rewards_claimed || [],
          updatedAt: nutritionResult.data.updated_at,
        } : null);

        setWorkoutStreak(workoutSummary);
        setNutritionStreak(nutritionSummary);

        // 주간 리포트 조회
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.toISOString().split('T')[0];

        const response = await fetch(`/api/reports/weekly?weekStart=${weekStart}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setWeeklyReport(data.data);
          }
        }
      } catch (error) {
        console.error('TodayFocus 데이터 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, userId]);

  // Streak 경고 알림
  useEffect(() => {
    if (hasShownWarning.current) return;
    if (isLoading) return;

    const settings = loadNotificationSettings();
    if (!settings.enabled || !settings.streakWarning) return;

    if (workoutStreak?.isActive && workoutStreak.warningMessage && workoutStreak.currentStreak >= 3) {
      showStreakWarning('workout', workoutStreak.currentStreak);
      hasShownWarning.current = true;
    }

    if (nutritionStreak?.isActive && nutritionStreak.warningMessage && nutritionStreak.currentStreak >= 3) {
      showStreakWarning('nutrition', nutritionStreak.currentStreak);
      hasShownWarning.current = true;
    }
  }, [isLoading, workoutStreak, nutritionStreak]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 animate-pulse"
        data-testid="today-focus-loading"
      >
        <div className="h-8 bg-amber-100 rounded w-1/3 mb-4" />
        <div className="h-24 bg-amber-100 rounded mb-4" />
        <div className="h-12 bg-amber-100 rounded" />
      </div>
    );
  }

  // 유저 없음
  if (!userId) {
    return null;
  }

  const totalStreak = (workoutStreak?.currentStreak || 0) + (nutritionStreak?.currentStreak || 0);
  const isAnyActive = workoutStreak?.isActive || nutritionStreak?.isActive;
  const hasWeeklyData = weeklyReport && weeklyReport.nutrition.summary.daysWithRecords > 0;

  return (
    <>
      <div
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl border border-amber-100 overflow-hidden"
        data-testid="today-focus-widget"
      >
        {/* 헤더 + 설정 */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-amber-700 uppercase tracking-wide">
                오늘의 기록
              </span>
            </div>
            <Link
              href="/settings"
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              aria-label="알림 설정으로 이동"
            >
              <Settings className="w-4 h-4 text-amber-600" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* 스트릭 메인 (Hero) */}
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-amber-600">
                  {totalStreak}
                  <span className="text-xl text-amber-500 ml-1">일</span>
                </p>
                <InfoTooltip
                  content="매일 운동이나 식단을 기록하면 연속 기록이 쌓여요! 연속 기록을 유지하면 특별한 보상을 받을 수 있어요."
                  variant="help"
                  size="md"
                />
              </div>
              <p className="text-sm text-amber-600/80 mt-1">
                {isAnyActive ? '연속 기록 중' : '새로운 기록을 시작해보세요'}
              </p>
            </div>

            {/* 운동/영양 미니 스트릭 */}
            <div className="flex gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Dumbbell className="w-3 h-3 text-module-workout" />
                  <span className="text-xs text-muted-foreground">운동</span>
                </div>
                <p className="text-lg font-bold text-module-workout">
                  {workoutStreak?.currentStreak || 0}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Utensils className="w-3 h-3 text-module-nutrition" />
                  <span className="text-xs text-muted-foreground">영양</span>
                </div>
                <p className="text-lg font-bold text-module-nutrition">
                  {nutritionStreak?.currentStreak || 0}
                </p>
              </div>
            </div>
          </div>

          {/* 마일스톤 알림 - 펄스 애니메이션 */}
          {(workoutStreak?.daysToNextMilestone === 1 || nutritionStreak?.daysToNextMilestone === 1) && (
            <div className="relative bg-amber-100 rounded-lg p-2.5 mb-4 overflow-hidden animate-fade-in-up">
              {/* 배경 펄스 효과 */}
              <div className="absolute inset-0 bg-amber-200/50 animate-pulse" />
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  {/* 아이콘 글로우 */}
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30 animate-ping" />
                </div>
                <span className="text-sm font-medium text-amber-700">
                  내일이면 마일스톤 달성! 🎯
                </span>
              </div>
            </div>
          )}

          {/* 체크인 버튼 */}
          <button
            onClick={() => setIsCheckinOpen(true)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
            aria-label="오늘의 체크인 시작하기"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            오늘의 나 체크인하기
          </button>
        </div>

        {/* 주간 요약 (하단) */}
        {hasWeeklyData && (
          <div className="px-5 py-3 bg-white/40 border-t border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-module-nutrition" />
                  <span className="text-sm text-foreground">
                    {Math.round(weeklyReport.nutrition.summary.avgCaloriesPerDay).toLocaleString()}kcal
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-status-info" />
                  <span className="text-sm text-foreground">
                    {(weeklyReport.nutrition.summary.avgWaterPerDay / 1000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-module-workout" />
                  <span className="text-sm text-foreground">
                    {weeklyReport.workout.summary.totalSessions}회
                  </span>
                </div>
              </div>
              <Link
                href="/reports"
                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                aria-label="주간 리포트 상세 보기"
              >
                상세
                <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 체크인 모달 */}
      <DailyCheckin
        open={isCheckinOpen}
        onOpenChange={setIsCheckinOpen}
      />
    </>
  );
}
