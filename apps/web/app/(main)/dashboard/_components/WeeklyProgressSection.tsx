'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Droplets,
  Dumbbell,
  Utensils,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { WeeklyReport } from '@/types/report';

interface ModuleStatus {
  workout: {
    hasAnalysis: boolean;
    workoutType?: string;
  };
  nutrition: {
    hasSettings: boolean;
    goal?: string;
  };
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  maintenance: '체중 유지',
  health: '건강 관리',
};

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  toner: '토너',
  builder: '빌더',
  burner: '버너',
  mover: '무버',
  flexer: '플렉서',
};

/**
 * 주간 진행 상황 섹션 (Zone 2)
 * - 왼쪽: 주간 통계 (칼로리/수분/운동)
 * - 오른쪽: 모듈 상태 (운동/영양)
 */
export default function WeeklyProgressSection() {
  const supabase = useClerkSupabaseClient();
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        // 현재 주 시작일 계산 (월요일 기준)
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.toISOString().split('T')[0];
        setCurrentWeekStart(weekStart);

        // 병렬로 데이터 조회
        const [reportResponse, workoutResult, nutritionResult] = await Promise.all([
          fetch(`/api/reports/weekly?weekStart=${weekStart}`),
          supabase
            .from('workout_analyses')
            .select('workout_type')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from('nutrition_settings').select('goal').maybeSingle(),
        ]);

        // 주간 리포트 처리
        if (reportResponse.ok) {
          const data = await reportResponse.json();
          if (data.success && data.data) {
            setWeeklyReport(data.data);
          }
        }

        // 모듈 상태 처리
        setModuleStatus({
          workout: {
            hasAnalysis: !!workoutResult.data,
            workoutType: workoutResult.data?.workout_type,
          },
          nutrition: {
            hasSettings: !!nutritionResult.data,
            goal: nutritionResult.data?.goal,
          },
        });
      } catch (error) {
        console.error('WeeklyProgress 데이터 조회 실패:', error);
        setModuleStatus({
          workout: { hasAnalysis: false },
          nutrition: { hasSettings: false },
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  if (isLoading) {
    return (
      <section data-testid="weekly-progress-loading">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-muted-foreground">이번 주 현황</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const hasWeeklyData = weeklyReport && weeklyReport.nutrition.summary.daysWithRecords > 0;

  return (
    <section data-testid="weekly-progress-section">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-muted-foreground">이번 주 현황</h2>
        {hasWeeklyData && (
          <Link
            href={`/reports/weekly/${currentWeekStart}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            상세보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* 2열 그리드: 통계 | 모듈 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 왼쪽: 주간 통계 */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              주간 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasWeeklyData ? (
              <div className="grid grid-cols-3 gap-3">
                {/* 평균 칼로리 */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-module-nutrition-light mb-2">
                    <Flame className="h-4 w-4 text-module-nutrition" />
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {Math.round(weeklyReport.nutrition.summary.avgCaloriesPerDay).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">평균 kcal</p>
                </div>

                {/* 평균 수분 */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-status-info/20 mb-2">
                    <Droplets className="h-4 w-4 text-status-info" />
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {(weeklyReport.nutrition.summary.avgWaterPerDay / 1000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-muted-foreground">평균 수분</p>
                </div>

                {/* 운동 횟수 */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-module-workout-light mb-2">
                    <Dumbbell className="h-4 w-4 text-module-workout" />
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {weeklyReport.workout.summary.totalSessions}회
                  </p>
                  <p className="text-xs text-muted-foreground">운동</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  이번 주 기록이 없습니다
                </p>
                <Link
                  href="/nutrition"
                  className="text-sm text-primary hover:underline"
                >
                  기록 시작하기 &rarr;
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오른쪽: 모듈 상태 */}
        <div className="space-y-3">
          {/* 운동 모듈 */}
          <ModuleStatusCard
            title="운동"
            icon={<Dumbbell className="w-4 h-4" />}
            href="/workout"
            isCompleted={moduleStatus?.workout.hasAnalysis || false}
            completedText={
              moduleStatus?.workout.workoutType
                ? `${WORKOUT_TYPE_LABELS[moduleStatus.workout.workoutType] || moduleStatus.workout.workoutType} 타입`
                : '분석 완료'
            }
            pendingText="분석 시작하기"
            bgColor="bg-module-workout-light"
            borderColor="border-module-workout/30"
            iconColor="text-module-workout"
          />

          {/* 영양 모듈 */}
          <ModuleStatusCard
            title="영양"
            icon={<Utensils className="w-4 h-4" />}
            href="/nutrition"
            isCompleted={moduleStatus?.nutrition.hasSettings || false}
            completedText={
              moduleStatus?.nutrition.goal
                ? GOAL_LABELS[moduleStatus.nutrition.goal] || moduleStatus.nutrition.goal
                : '설정 완료'
            }
            pendingText="설정 시작하기"
            bgColor="bg-module-nutrition-light"
            borderColor="border-module-nutrition/30"
            iconColor="text-module-nutrition"
          />
        </div>
      </div>
    </section>
  );
}

interface ModuleStatusCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  isCompleted: boolean;
  completedText: string;
  pendingText: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

function ModuleStatusCard({
  title,
  icon,
  href,
  isCompleted,
  completedText,
  pendingText,
  bgColor,
  borderColor,
  iconColor,
}: ModuleStatusCardProps) {
  return (
    <Link href={href}>
      <div
        className={`
          ${bgColor} ${borderColor}
          rounded-xl border p-3
          hover:shadow-md transition-shadow cursor-pointer
          group
        `}
        data-testid={`module-status-${title.toLowerCase()}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg bg-card/70 ${iconColor}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-status-success" />
                    <span className="text-xs text-muted-foreground">{completedText}</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{pendingText}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
}
