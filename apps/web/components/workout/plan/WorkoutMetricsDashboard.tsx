'use client';

import { TrendingUp, CheckCircle, AlertTriangle, ArrowUp, Flame } from 'lucide-react';
import type { WorkoutPlan } from '@/types/workout';

// 지표 상태 타입
type MetricStatus = 'achieved' | 'warning' | 'progress' | 'info';

// 개별 지표 데이터
interface MetricItem {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  status: MetricStatus;
  icon: 'check' | 'warning' | 'up' | 'flame' | 'info';
}

// 부위 균형 비율 계산용
interface BalanceRatio {
  upper: number;
  lower: number;
  core: number;
}

interface WorkoutMetricsDashboardProps {
  plan: WorkoutPlan;
  frequency: string;
  userWeight: number;
  // 이번 주 실제 완료한 운동 일수 (운동 기록 연동 전까지 mock)
  completedDays?: number;
  // 현재 연속 기록 (운동 기록 연동 전까지 mock)
  currentStreak?: number;
  // 이전 주 볼륨 (운동 기록 연동 전까지 mock)
  previousWeekVolume?: number;
}

/**
 * 빈도 문자열에서 목표 운동 일수 추출
 */
function getTargetDaysFromFrequency(frequency: string): number {
  switch (frequency) {
    case '1-2':
      return 2;
    case '3-4':
      return 4;
    case '5-6':
      return 6;
    case 'daily':
      return 7;
    default:
      return 3;
  }
}

/**
 * 부위 분포에서 상체/하체/코어 비율 계산
 */
function calculateBalanceRatio(distribution: Record<string, number>): BalanceRatio {
  const upper = (distribution.upper || 0);
  const lower = (distribution.lower || 0);
  const core = (distribution.core || 0);
  const cardio = (distribution.cardio || 0);

  // cardio는 전신으로 간주하여 균등 분배
  const cardioShare = cardio / 3;

  const total = upper + lower + core + cardio;
  if (total === 0) {
    return { upper: 0, lower: 0, core: 0 };
  }

  return {
    upper: Math.round(((upper + cardioShare) / total) * 100),
    lower: Math.round(((lower + cardioShare) / total) * 100),
    core: Math.round(((core + cardioShare) / total) * 100),
  };
}

/**
 * 균형 상태 평가 (이상 비율: 4:4:2)
 */
function evaluateBalance(balance: BalanceRatio): MetricStatus {
  // 이상 비율: upper 40%, lower 40%, core 20%
  const upperDiff = Math.abs(balance.upper - 40);
  const lowerDiff = Math.abs(balance.lower - 40);
  const coreDiff = Math.abs(balance.core - 20);

  const totalDiff = upperDiff + lowerDiff + coreDiff;

  if (totalDiff <= 15) return 'achieved';
  if (totalDiff <= 30) return 'warning';
  return 'progress';
}

/**
 * 목표 달성률에 따른 상태
 */
function evaluateGoalProgress(percentage: number): MetricStatus {
  if (percentage >= 80) return 'achieved';
  if (percentage >= 50) return 'warning';
  return 'progress';
}

/**
 * 상태에 따른 아이콘 렌더링
 */
function StatusIcon({ status, icon }: { status: MetricStatus; icon: MetricItem['icon'] }) {
  const colorClass = {
    achieved: 'text-green-500',
    warning: 'text-yellow-500',
    progress: 'text-blue-500',
    info: 'text-muted-foreground',
  }[status];

  switch (icon) {
    case 'check':
      return <CheckCircle className={`w-5 h-5 ${colorClass}`} />;
    case 'warning':
      return <AlertTriangle className={`w-5 h-5 ${colorClass}`} />;
    case 'up':
      return <ArrowUp className={`w-5 h-5 ${colorClass}`} />;
    case 'flame':
      return <Flame className={`w-5 h-5 ${colorClass}`} />;
    default:
      return <TrendingUp className={`w-5 h-5 ${colorClass}`} />;
  }
}

export function WorkoutMetricsDashboard({
  plan,
  frequency,
  userWeight,
  completedDays = 0,
  currentStreak = 0,
  previousWeekVolume = 0,
}: WorkoutMetricsDashboardProps) {
  // 운동일 수 계산
  const workoutDays = plan.days.filter((d) => !d.isRestDay).length;
  const targetDays = getTargetDaysFromFrequency(frequency);

  // 부위 분포 계산
  const distribution: Record<string, number> = {};
  plan.days.forEach((day) => {
    if (!day.isRestDay && day.categories) {
      day.categories.forEach((cat) => {
        distribution[cat] = (distribution[cat] || 0) + 1;
      });
    }
  });
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  const normalizedDistribution: Record<string, number> = {};
  Object.entries(distribution).forEach(([key, value]) => {
    normalizedDistribution[key] = total > 0 ? value / total : 0;
  });

  const balance = calculateBalanceRatio(normalizedDistribution);

  // 목표 달성률 계산
  const goalProgress = workoutDays > 0 ? Math.round((completedDays / workoutDays) * 100) : 0;

  // 볼륨 계산 (현재는 계획 기반 예상 볼륨)
  // 실제 운동 기록 연동 후에는 실제 볼륨으로 대체
  // 추정 무게는 사용자 체중의 약 30%를 기본으로 사용
  const baseWeight = Math.round(userWeight * 0.3);
  const estimatedVolume = plan.days.reduce((sum, day) => {
    if (day.isRestDay) return sum;
    return sum + day.exercises.reduce((exSum, ex) => {
      // 운동당 예상 볼륨 (세트 x 횟수 x 추정 무게)
      const sets = 3;
      const reps = 12;
      const weight = ex.category === 'cardio' ? 0 : baseWeight; // 유산소는 볼륨 제외
      return exSum + sets * reps * weight;
    }, 0);
  }, 0);

  const volumeChange = previousWeekVolume > 0
    ? Math.round(((estimatedVolume - previousWeekVolume) / previousWeekVolume) * 100)
    : 0;

  // 7가지 지표 데이터 구성
  const metrics: MetricItem[] = [
    {
      id: 'frequency',
      label: '운동 빈도',
      value: `${completedDays}/${targetDays}회`,
      subValue: '주간',
      status: completedDays >= targetDays ? 'achieved' : completedDays >= targetDays * 0.5 ? 'warning' : 'progress',
      icon: completedDays >= targetDays ? 'check' : 'info',
    },
    {
      id: 'time',
      label: '총 시간',
      value: `${plan.totalMinutes}분`,
      subValue: '계획',
      status: 'achieved',
      icon: 'check',
    },
    {
      id: 'calories',
      label: '칼로리',
      value: `${plan.totalCalories.toLocaleString()}kcal`,
      subValue: '예상 소모',
      status: 'achieved',
      icon: 'check',
    },
    {
      id: 'volume',
      label: '볼륨',
      value: `${estimatedVolume.toLocaleString()}kg`,
      subValue: volumeChange !== 0 ? `${volumeChange > 0 ? '+' : ''}${volumeChange}%` : '기준',
      status: volumeChange > 0 ? 'achieved' : volumeChange < 0 ? 'warning' : 'info',
      icon: volumeChange >= 0 ? 'up' : 'warning',
    },
    {
      id: 'balance',
      label: '부위 균형',
      value: `상${balance.upper}:하${balance.lower}`,
      subValue: `코어 ${balance.core}%`,
      status: evaluateBalance(balance),
      icon: evaluateBalance(balance) === 'achieved' ? 'check' : 'warning',
    },
    {
      id: 'goalProgress',
      label: '목표 달성률',
      value: `${goalProgress}%`,
      subValue: `${completedDays}/${workoutDays}일 완료`,
      status: evaluateGoalProgress(goalProgress),
      icon: goalProgress >= 80 ? 'check' : goalProgress >= 50 ? 'warning' : 'info',
    },
    {
      id: 'streak',
      label: '연속 기록',
      value: `${currentStreak}일`,
      subValue: currentStreak >= 7 ? '대단해요!' : currentStreak >= 3 ? '좋은 시작!' : '화이팅!',
      status: currentStreak >= 7 ? 'achieved' : currentStreak >= 3 ? 'warning' : 'progress',
      icon: 'flame',
    },
  ];

  return (
    <div
      className="bg-card rounded-2xl shadow-sm border border-border p-5"
      data-testid="workout-metrics-dashboard"
    >
      {/* 헤더 */}
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        이번 주 운동 지표
      </h3>

      {/* 지표 그리드 - 상위 6개 */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.slice(0, 6).map((metric) => (
          <div
            key={metric.id}
            className={`rounded-xl p-3 ${
              metric.status === 'achieved'
                ? 'bg-green-50'
                : metric.status === 'warning'
                  ? 'bg-yellow-50'
                  : metric.status === 'progress'
                    ? 'bg-blue-50'
                    : 'bg-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <StatusIcon status={metric.status} icon={metric.icon} />
            </div>
            <p className="text-lg font-bold text-foreground">{metric.value}</p>
            {metric.subValue && (
              <p className="text-xs text-muted-foreground">{metric.subValue}</p>
            )}
          </div>
        ))}
      </div>

      {/* 연속 기록 (Streak) - 전체 너비로 강조 */}
      {metrics[6] && (
        <div
          className={`mt-3 rounded-xl p-4 flex items-center justify-between ${
            metrics[6].status === 'achieved'
              ? 'bg-gradient-to-r from-orange-50 to-yellow-50'
              : metrics[6].status === 'warning'
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-sm">
              <Flame className={`w-5 h-5 ${
                metrics[6].status === 'achieved' ? 'text-orange-500' :
                metrics[6].status === 'warning' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{metrics[6].label}</span>
              <p className="text-xl font-bold text-foreground">{metrics[6].value}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground/80">{metrics[6].subValue}</p>
            {currentStreak >= 7 && (
              <p className="text-xs text-orange-600">7일 달성!</p>
            )}
          </div>
        </div>
      )}

      {/* 레이더 차트 영역 (향후 구현) */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-center h-32 bg-muted rounded-xl">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              운동 기록 후 상세 분석 차트가 표시됩니다
            </p>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      {completedDays === 0 && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary">
            운동을 시작하면 실시간으로 지표가 업데이트됩니다!
          </p>
        </div>
      )}
    </div>
  );
}
