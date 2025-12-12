'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Calendar, List } from 'lucide-react';
import {
  WeeklyCalendar,
  WorkoutHistoryCard,
  HistoryStats,
} from '@/components/workout/history';
import { StreakCard } from '@/components/workout/streak';
import { AnalyzingLoader, ErrorState } from '@/components/workout/common';
import { getStreakSummary } from '@/lib/workout/streak';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { WorkoutLog, WorkoutStreak } from '@/lib/api/workout';

/**
 * 운동 기록 페이지
 * - 주간 캘린더 뷰
 * - 운동 기록 리스트
 * - 통계 요약
 */
export default function HistoryPage() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // 최근 30일 운동 기록 조회
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logsData, error: logsError } = await supabase
          .from('workout_logs')
          .select('*')
          .gte('workout_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('workout_date', { ascending: false });

        if (logsError) {
          console.error('Failed to fetch workout logs:', logsError);
        }

        // Streak 조회
        const { data: streakData, error: streakError } = await supabase
          .from('workout_streaks')
          .select('*')
          .single();

        if (streakError && streakError.code !== 'PGRST116') {
          console.error('Failed to fetch streak:', streakError);
        }

        setWorkoutLogs((logsData as WorkoutLog[]) || []);
        setStreak((streakData as WorkoutStreak) || null);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('기록을 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, supabase]);

  // 주간 캘린더 데이터 생성
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // 월요일을 시작으로 계산
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // 해당 날짜의 운동 기록 찾기
      const log = workoutLogs.find((l) => l.workout_date === dateStr);

      let status: 'completed' | 'skipped' | 'rest' | 'planned' | 'today';
      let label = '';

      if (dateStr === todayStr) {
        status = log ? 'completed' : 'today';
      } else if (date > today) {
        status = 'planned';
      } else if (log) {
        status = 'completed';
        // 첫 번째 운동의 카테고리로 라벨 설정
        if (log.exercise_logs && log.exercise_logs.length > 0) {
          label = log.exercise_logs[0].exercise_name.slice(0, 2);
        }
      } else {
        // 주말은 휴식일로 처리 (예시)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        status = isWeekend ? 'rest' : 'skipped';
      }

      return { date: dateStr, status, label };
    });
  }, [workoutLogs]);

  // 통계 계산
  const stats = useMemo(() => {
    const thisWeekLogs = workoutLogs.filter((log) => {
      const logDate = new Date(log.workout_date);
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return logDate >= weekAgo && logDate <= today;
    });

    return {
      totalWorkouts: thisWeekLogs.length,
      totalMinutes: thisWeekLogs.reduce((sum, l) => sum + (l.actual_duration || 0), 0),
      totalCalories: thisWeekLogs.reduce((sum, l) => sum + (l.actual_calories || 0), 0),
      totalVolume: thisWeekLogs.reduce((sum, l) => sum + (l.total_volume || 0), 0),
      // 목표: 주 5회 운동
      completionRate: Math.min(100, Math.round((thisWeekLogs.length / 5) * 100)),
    };
  }, [workoutLogs]);

  // 날짜 클릭 핸들러
  const handleDayClick = useCallback((date: string) => {
    const log = workoutLogs.find((l) => l.workout_date === date);
    if (log) {
      // TODO: 운동 기록 상세 페이지 구현 후 연결
      // router.push(`/workout/history/${log.id}`);
    }
  }, [workoutLogs]);

  // 기록 클릭 핸들러
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogClick = useCallback((logId: string) => {
    // TODO: 운동 기록 상세 페이지 구현 후 연결
    // router.push(`/workout/history/${logId}`);
  }, []);

  if (isLoading) {
    return (
      <AnalyzingLoader
        title="기록 불러오는 중"
        subtitle="운동 기록을 가져오고 있어요..."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => router.push('/workout/plan')}
        retryLabel="플랜으로 돌아가기"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">운동 기록</h1>
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500'
              }`}
              aria-label="캘린더 보기"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500'
              }`}
              aria-label="리스트 보기"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Streak 카드 */}
        <StreakCard
          summary={getStreakSummary(streak)}
          onStartWorkout={() => router.push('/workout/session')}
        />

        {/* 통계 요약 */}
        <HistoryStats
          totalWorkouts={stats.totalWorkouts}
          totalMinutes={stats.totalMinutes}
          totalCalories={stats.totalCalories}
          totalVolume={stats.totalVolume}
          completionRate={stats.completionRate}
        />

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' && (
          <WeeklyCalendar
            weekDays={weekDays}
            currentStreak={streak?.current_streak}
            onDayClick={handleDayClick}
          />
        )}

        {/* 기록 리스트 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 px-1">
            최근 기록
          </h2>

          {workoutLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500 mb-4">아직 운동 기록이 없어요</p>
              <button
                onClick={() => router.push('/workout/session')}
                className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
              >
                첫 운동 시작하기
              </button>
            </div>
          ) : (
            workoutLogs.map((log) => (
              <WorkoutHistoryCard
                key={log.id}
                log={log}
                onClick={() => handleLogClick(log.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
