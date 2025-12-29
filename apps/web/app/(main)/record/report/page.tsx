'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Flame,
  Dumbbell,
  Droplets,
  Utensils,
  ChevronRight,
  Download,
  Share2,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

/**
 * 리포트 상세 페이지 - UX 리스트럭처링
 * - 기간 선택 (주간/월간)
 * - 운동 통계 (총 운동 시간, 소모 칼로리, 운동 횟수)
 * - 영양 통계 (평균 섭취 칼로리, 단백질, 물 섭취량)
 * - 트렌드 차트 (주간/월간 비교)
 * - 목표 달성률
 * - 인사이트 (AI 분석)
 */

type PeriodType = 'weekly' | 'monthly';

interface StatCard {
  label: string;
  value: string;
  unit: string;
  change: number; // 전 기간 대비 변화율
  icon: typeof Flame;
  iconColor: string;
}

// 임시 데이터 - 주간
const weeklyWorkoutStats: StatCard[] = [
  { label: '총 운동 시간', value: '5.5', unit: '시간', change: 12, icon: Dumbbell, iconColor: 'text-blue-500' },
  { label: '소모 칼로리', value: '2,340', unit: 'kcal', change: 8, icon: Flame, iconColor: 'text-orange-500' },
  { label: '운동 횟수', value: '5', unit: '회', change: 25, icon: TrendingUp, iconColor: 'text-green-500' },
];

const weeklyNutritionStats: StatCard[] = [
  { label: '평균 섭취', value: '1,850', unit: 'kcal', change: -5, icon: Utensils, iconColor: 'text-amber-500' },
  { label: '평균 단백질', value: '95', unit: 'g', change: 15, icon: TrendingUp, iconColor: 'text-purple-500' },
  { label: '평균 물 섭취', value: '2.1', unit: 'L', change: 10, icon: Droplets, iconColor: 'text-cyan-500' },
];

// 임시 데이터 - 월간
const monthlyWorkoutStats: StatCard[] = [
  { label: '총 운동 시간', value: '22', unit: '시간', change: 15, icon: Dumbbell, iconColor: 'text-blue-500' },
  { label: '소모 칼로리', value: '9,560', unit: 'kcal', change: 10, icon: Flame, iconColor: 'text-orange-500' },
  { label: '운동 횟수', value: '18', unit: '회', change: 20, icon: TrendingUp, iconColor: 'text-green-500' },
];

const monthlyNutritionStats: StatCard[] = [
  { label: '평균 섭취', value: '1,820', unit: 'kcal', change: -3, icon: Utensils, iconColor: 'text-amber-500' },
  { label: '평균 단백질', value: '92', unit: 'g', change: 18, icon: TrendingUp, iconColor: 'text-purple-500' },
  { label: '평균 물 섭취', value: '2.0', unit: 'L', change: 8, icon: Droplets, iconColor: 'text-cyan-500' },
];

// 목표 달성률 데이터
interface GoalProgress {
  label: string;
  current: number;
  target: number;
  unit: string;
}

const weeklyGoals: GoalProgress[] = [
  { label: '운동 목표', current: 5, target: 5, unit: '회' },
  { label: '칼로리 목표', current: 4, target: 7, unit: '일' },
  { label: '물 섭취 목표', current: 6, target: 7, unit: '일' },
];

// AI 인사이트
const insights = [
  {
    type: 'positive',
    message: '이번 주 운동 횟수가 지난주 대비 25% 증가했어요! 꾸준히 잘하고 있어요.',
  },
  {
    type: 'suggestion',
    message: '단백질 섭취량이 목표에 조금 부족해요. 닭가슴살이나 계란을 추가해보세요.',
  },
  {
    type: 'positive',
    message: '물 섭취량이 목표의 85%를 달성했어요. 조금만 더 마시면 완벽해요!',
  },
];

// 일별 기록 데이터 (간단한 차트용)
const weeklyData = [
  { day: '월', workout: 45, calories: 350, water: 2.0 },
  { day: '화', workout: 0, calories: 0, water: 1.8 },
  { day: '수', workout: 60, calories: 520, water: 2.2 },
  { day: '목', workout: 30, calories: 280, water: 2.1 },
  { day: '금', workout: 75, calories: 610, water: 2.4 },
  { day: '토', workout: 90, calories: 780, water: 2.0 },
  { day: '일', workout: 0, calories: 0, water: 1.9 },
];

function StatCardComponent({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;
  const isPositive = stat.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-5 h-5', stat.iconColor)} />
        <span className="text-sm text-muted-foreground">{stat.label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-foreground">{stat.value}</span>
        <span className="text-sm text-muted-foreground">{stat.unit}</span>
      </div>
      <div
        className={cn(
          'flex items-center gap-1 text-xs',
          isPositive ? 'text-green-600' : 'text-red-500'
        )}
      >
        <TrendIcon className="w-3 h-3" />
        <span>
          {isPositive ? '+' : ''}
          {stat.change}% vs 지난 기간
        </span>
      </div>
    </div>
  );
}

function GoalProgressBar({ goal }: { goal: GoalProgress }) {
  const progress = Math.min((goal.current / goal.target) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-foreground">{goal.label}</span>
          <span className="text-sm text-muted-foreground">
            {goal.current}/{goal.target}
            {goal.unit}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100 ? 'bg-green-500' : progress >= 70 ? 'bg-primary' : 'bg-amber-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>('weekly');

  const workoutStats = period === 'weekly' ? weeklyWorkoutStats : monthlyWorkoutStats;
  const nutritionStats = period === 'weekly' ? weeklyNutritionStats : monthlyNutritionStats;

  return (
    <div className="min-h-screen bg-background pb-6" data-testid="report-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">상세 리포트</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              aria-label="공유"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              aria-label="다운로드"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-2 px-4 py-2">
          {[
            { id: 'weekly', label: '주간' },
            { id: 'monthly', label: '월간' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodType)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-colors',
                period === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Calendar className="w-4 h-4" />
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* 본문 */}
      <main className="px-4 py-4 space-y-6">
        {/* 운동 통계 */}
        <FadeInUp>
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-500" />
              운동 통계
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {workoutStats.map((stat, index) => (
                <StatCardComponent key={index} stat={stat} />
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* 주간 운동 차트 (간단한 바 차트) */}
        {period === 'weekly' && (
          <FadeInUp delay={1}>
            <section className="bg-card rounded-xl border p-4">
              <h3 className="font-medium text-foreground mb-4">일별 운동 시간</h3>
              <div className="flex items-end justify-between gap-2 h-24">
                {weeklyData.map((day) => {
                  const height = day.workout > 0 ? Math.max((day.workout / 90) * 100, 10) : 5;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          'w-full rounded-t transition-all',
                          day.workout > 0 ? 'bg-primary' : 'bg-muted'
                        )}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </FadeInUp>
        )}

        {/* 영양 통계 */}
        <FadeInUp delay={2}>
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-500" />
              영양 통계
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {nutritionStats.map((stat, index) => (
                <StatCardComponent key={index} stat={stat} />
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* 목표 달성률 */}
        <FadeInUp delay={3}>
          <section className="bg-card rounded-xl border p-4">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              {period === 'weekly' ? '이번 주' : '이번 달'} 목표 달성률
            </h2>
            <div className="space-y-4">
              {weeklyGoals.map((goal, index) => (
                <GoalProgressBar key={index} goal={goal} />
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* AI 인사이트 */}
        <FadeInUp delay={4}>
          <section className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-violet-600" />
              AI 인사이트
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg text-sm',
                    insight.type === 'positive'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-amber-50 text-amber-800'
                  )}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>

        {/* 상세 기록 보기 링크 */}
        <FadeInUp delay={5}>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/workout')}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-foreground">운동 기록 상세보기</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => router.push('/nutrition')}
              className="w-full flex items-center justify-between p-4 bg-card rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-foreground">영양 기록 상세보기</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </FadeInUp>
      </main>
    </div>
  );
}
