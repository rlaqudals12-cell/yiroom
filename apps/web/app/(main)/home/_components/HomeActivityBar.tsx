'use client';

/**
 * 홈 활동 바 — 내재화 진행도 + 오늘 활동 요약
 *
 * 상단: 인사이트 내재화 진행도 (ConnectionAwareness 기반)
 * 하단: 칼로리 | 운동 | 수분 (3칸 그리드)
 * 빈 상태: 행동 유도 CTA
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Dumbbell, Droplets, Brain, ChevronRight } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { ConnectionStats } from '@/lib/connection-awareness';
import { getConnectionStats } from '@/lib/connection-awareness';

// 4단계 내재화 상태별 세그먼트 설정
const STATUS_SEGMENTS = [
  {
    key: 'exposed' as const,
    label: '발견',
    color: 'bg-slate-300 dark:bg-slate-600',
    dot: 'bg-slate-400',
  },
  {
    key: 'recognized' as const,
    label: '인식',
    color: 'bg-violet-300 dark:bg-violet-700',
    dot: 'bg-violet-400',
  },
  {
    key: 'internalized' as const,
    label: '내재화',
    color: 'bg-indigo-400 dark:bg-indigo-600',
    dot: 'bg-indigo-400',
  },
  {
    key: 'independent' as const,
    label: '자립',
    color: 'bg-emerald-400 dark:bg-emerald-600',
    dot: 'bg-emerald-400',
  },
];

interface DailyActivity {
  calories: number;
  caloriesTarget: number;
  exercise: number; // 분
  water: number; // 잔
  waterTarget: number;
}

interface HomeActivityBarProps {
  userId: string;
}

export default function HomeActivityBar({ userId }: HomeActivityBarProps) {
  const supabase = useClerkSupabaseClient();
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [activity, setActivity] = useState<DailyActivity>({
    calories: 0,
    caloriesTarget: 2000,
    exercise: 0,
    water: 0,
    waterTarget: 8,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      try {
        // 내재화 통계 + 활동 데이터 병렬 조회
        const [connectionStats, settingsRes, nutritionRes, waterRes, workoutRes] =
          await Promise.all([
            getConnectionStats(supabase, userId).catch(() => null),
            supabase.from('nutrition_settings').select('daily_calories, water_goal').single(),
            supabase
              .from('daily_nutrition_summary')
              .select('total_calories')
              .eq('date', today)
              .single(),
            supabase.from('water_records').select('amount').eq('date', today),
            supabase
              .from('workout_logs')
              .select('duration_minutes')
              .gte('created_at', `${today}T00:00:00`)
              .lte('created_at', `${today}T23:59:59`),
          ]);

        setStats(connectionStats);

        const totalWater = waterRes.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalExercise =
          workoutRes.data?.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) || 0;

        setActivity({
          calories: nutritionRes.data?.total_calories || 0,
          caloriesTarget: settingsRes.data?.daily_calories || 2000,
          exercise: totalExercise,
          water: Math.floor(totalWater / 250),
          waterTarget: settingsRes.data?.water_goal || 8,
        });
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, supabase]);

  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (hasError) {
    return (
      <section
        className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 shadow-sm"
        data-testid="home-activity-bar-error"
      >
        <p className="text-sm text-muted-foreground">활동 데이터를 불러오지 못했어요.</p>
      </section>
    );
  }

  const isEmpty = activity.calories === 0 && activity.exercise === 0 && activity.water === 0;

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-4 shadow-sm"
      data-testid="home-activity-bar"
      role="region"
      aria-label="오늘의 활동 요약"
    >
      {/* 내재화 진행도 — 4단계 세그먼트 바 (InternalizationWidget 통합) */}
      {stats && stats.totalConnections > 0 && (
        <div className="mb-3" data-testid="internalization-segment-bar">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-foreground">
              자기 이해 {Math.round(stats.internalizationRate * 100)}%
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {stats.byStatus.independent + stats.byStatus.internalized}/{stats.totalConnections}
            </span>
          </div>
          {/* 4-status 세그먼트 바 */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            {STATUS_SEGMENTS.map(({ key, color }) => {
              const count = stats.byStatus[key];
              if (count === 0) return null;
              const pct = (count / stats.totalConnections) * 100;
              return (
                <div
                  key={key}
                  className={`${color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>
          {/* 컴팩트 범례 */}
          <div className="flex gap-3 mt-1.5">
            {STATUS_SEGMENTS.map(({ key, label, dot }) => (
              <span
                key={key}
                className="text-[10px] text-muted-foreground flex items-center gap-0.5"
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
                {label} {stats.byStatus[key]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 활동 요약 또는 빈 상태 */}
      {isEmpty ? (
        <Link
          href="/dashboard"
          className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <span>오늘의 첫 기록을 시작해볼까요?</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <ActivityCell
            icon={Flame}
            color="text-orange-500"
            bgColor="bg-orange-500/10"
            value={activity.calories}
            target={activity.caloriesTarget}
            label="칼로리"
            unit="kcal"
          />
          <ActivityCell
            icon={Dumbbell}
            color="text-green-500"
            bgColor="bg-green-500/10"
            value={activity.exercise}
            target={60}
            label="운동"
            unit="분"
          />
          <ActivityCell
            icon={Droplets}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
            value={activity.water}
            target={activity.waterTarget}
            label="수분"
            unit="잔"
          />
        </div>
      )}
    </section>
  );
}

// 활동 셀 (3열 그리드 아이템)
function ActivityCell({
  icon: Icon,
  color,
  bgColor,
  value,
  target,
  label,
  unit = '',
}: {
  icon: typeof Flame;
  color: string;
  bgColor: string;
  value: number;
  target: number;
  label: string;
  unit?: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);

  return (
    <div className="text-center">
      <div
        className={`w-8 h-8 mx-auto rounded-lg ${bgColor} flex items-center justify-center mb-1`}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {value.toLocaleString()} {unit}
      </p>
      {/* 미니 프로그레스 */}
      <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1 mx-2">
        <div
          className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
