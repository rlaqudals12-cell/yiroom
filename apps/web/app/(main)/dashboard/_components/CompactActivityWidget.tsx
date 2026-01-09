'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Dumbbell, Droplets, ChevronRight } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

interface DailyActivity {
  calories: { current: number; target: number };
  exercise: { current: number; target: number }; // 분
  water: { current: number; target: number }; // 잔
}

interface CompactActivityWidgetProps {
  userId: string;
}

/**
 * 오늘 기록 축소 위젯
 * - 칼로리, 운동, 수분을 한 줄로 표시
 * - 기존 TodayFocusWidget + WeeklyProgressSection 대체
 */
export default function CompactActivityWidget({ userId }: CompactActivityWidgetProps) {
  const supabase = useClerkSupabaseClient();
  const [activity, setActivity] = useState<DailyActivity>({
    calories: { current: 0, target: 2000 },
    exercise: { current: 0, target: 60 },
    water: { current: 0, target: 8 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTodayActivity() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      try {
        // 영양 설정 (목표 칼로리)
        const { data: settings } = await supabase
          .from('nutrition_settings')
          .select('daily_calories, water_goal')
          .single();

        // 오늘 영양 요약
        const { data: nutrition } = await supabase
          .from('daily_nutrition_summary')
          .select('total_calories')
          .eq('date', today)
          .single();

        // 오늘 물 섭취
        const { data: waterData } = await supabase
          .from('water_records')
          .select('amount')
          .eq('date', today);

        // 오늘 운동 기록
        const { data: workoutData } = await supabase
          .from('workout_logs')
          .select('duration_minutes')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        const totalWater = waterData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalExercise =
          workoutData?.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) || 0;

        setActivity({
          calories: {
            current: nutrition?.total_calories || 0,
            target: settings?.daily_calories || 2000,
          },
          exercise: {
            current: totalExercise,
            target: 60,
          },
          water: {
            current: Math.floor(totalWater / 250), // 250ml = 1잔
            target: settings?.water_goal || 8,
          },
        });
      } catch (error) {
        console.error('[CompactActivityWidget] Failed to fetch activity:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTodayActivity();
  }, [userId, supabase]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-4 animate-pulse">
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  const items = [
    {
      id: 'calories',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      progressColor: 'bg-orange-500',
      label: '칼로리',
      current: activity.calories.current,
      target: activity.calories.target,
      unit: '',
      href: '/nutrition',
    },
    {
      id: 'exercise',
      icon: Dumbbell,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      progressColor: 'bg-green-500',
      label: '운동',
      current: activity.exercise.current,
      target: activity.exercise.target,
      unit: '분',
      href: '/workout',
    },
    {
      id: 'water',
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      progressColor: 'bg-blue-500',
      label: '수분',
      current: activity.water.current,
      target: activity.water.target,
      unit: '잔',
      href: '/nutrition',
    },
  ];

  return (
    <section
      className="bg-card rounded-xl border border-border/50 p-4"
      data-testid="compact-activity-widget"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">오늘 기록</h3>
        <Link
          href="/nutrition"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5"
        >
          상세보기
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 활동 항목들 */}
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min((item.current / item.target) * 100, 100);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 group"
              data-testid={`activity-${item.id}`}
            >
              {/* 아이콘 */}
              <div
                className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>

              {/* 라벨 */}
              <span className="text-sm text-muted-foreground w-12 flex-shrink-0">{item.label}</span>

              {/* 프로그레스 바 */}
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.progressColor} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* 수치 */}
              <span className="text-sm font-medium text-foreground w-20 text-right flex-shrink-0">
                {item.current.toLocaleString()} / {item.target.toLocaleString()}
                {item.unit}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
