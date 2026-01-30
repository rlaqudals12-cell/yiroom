/**
 * W-2 주간 스트레칭 플랜 카드
 *
 * @description 주간 스트레칭 일정 표시
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { WeeklyStretchingPlan, DailyRoutine } from '@/types/stretching';

interface WeeklyStretchingPlanCardProps {
  plan: WeeklyStretchingPlan;
  onDaySelect?: (day: keyof WeeklyStretchingPlan['days']) => void;
  selectedDay?: keyof WeeklyStretchingPlan['days'];
  className?: string;
}

const DAY_NAMES: Record<keyof WeeklyStretchingPlan['days'], string> = {
  monday: '월',
  tuesday: '화',
  wednesday: '수',
  thursday: '목',
  friday: '금',
  saturday: '토',
  sunday: '일',
};

const DAY_FULL_NAMES: Record<keyof WeeklyStretchingPlan['days'], string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일',
};

const TYPE_CONFIG: Record<DailyRoutine['type'], {
  emoji: string;
  label: string;
  color: string;
}> = {
  stretch: {
    emoji: '🧘',
    label: '스트레칭',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  strengthen: {
    emoji: '💪',
    label: '강화 운동',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  active_recovery: {
    emoji: '🚶',
    label: '능동적 회복',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rest: {
    emoji: '😴',
    label: '휴식',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
};

export function WeeklyStretchingPlanCard({
  plan,
  onDaySelect,
  selectedDay,
  className,
}: WeeklyStretchingPlanCardProps) {
  const today = getTodayKey();

  return (
    <Card className={className} data-testid="weekly-stretching-plan">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📅 주간 스트레칭 플랜</span>
          <Badge variant="outline">{plan.progressionWeek}주차</Badge>
        </CardTitle>
        <CardDescription>
          {plan.weekStartDate} 시작
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* 주간 캘린더 미니 뷰 */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {(Object.keys(plan.days) as (keyof WeeklyStretchingPlan['days'])[]).map((day) => {
            const routine = plan.days[day];
            const config = TYPE_CONFIG[routine.type];
            const isToday = day === today;
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                onClick={() => onDaySelect?.(day)}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg transition-colors',
                  isSelected && 'ring-2 ring-primary',
                  isToday && 'bg-primary/10',
                  !isSelected && !isToday && 'hover:bg-muted'
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {DAY_NAMES[day]}
                </span>
                <span className="text-lg">{config.emoji}</span>
                {routine.duration > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {routine.duration}분
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 날 상세 */}
        {selectedDay && (
          <DayDetail
            day={selectedDay}
            routine={plan.days[selectedDay]}
          />
        )}

        {/* 오늘 루틴 (선택 없을 때) */}
        {!selectedDay && today && (
          <DayDetail
            day={today}
            routine={plan.days[today]}
            isToday
          />
        )}

        {/* 주간 요약 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">이번 주 예상 운동량</span>
            <span className="font-medium">
              {calculateWeeklyStats(plan).totalMinutes}분 / {calculateWeeklyStats(plan).totalExercises}개 운동
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DayDetailProps {
  day: keyof WeeklyStretchingPlan['days'];
  routine: DailyRoutine;
  isToday?: boolean;
}

function DayDetail({ day, routine, isToday }: DayDetailProps) {
  const config = TYPE_CONFIG[routine.type];

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center gap-2">
          {config.emoji} {DAY_FULL_NAMES[day]}
          {isToday && <Badge variant="default" className="text-xs">오늘</Badge>}
        </h4>
        <Badge className={config.color}>
          {config.label}
        </Badge>
      </div>

      {routine.type === 'rest' ? (
        <p className="text-sm text-muted-foreground">
          {routine.notes || '휴식일입니다. 가벼운 걷기를 권장합니다.'}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              🕐 약 {routine.duration}분
            </span>
            <span className="text-muted-foreground">
              💪 {routine.stretches.length}개 운동
            </span>
          </div>

          {routine.stretches.length > 0 && (
            <div className="mt-2 space-y-1">
              {routine.stretches.slice(0, 3).map((stretch) => (
                <div
                  key={stretch.exercise.id}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span className="w-4 text-center">{stretch.order}.</span>
                  <span>{stretch.exercise.nameKo}</span>
                </div>
              ))}
              {routine.stretches.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{routine.stretches.length - 3}개 더
                </p>
              )}
            </div>
          )}

          {routine.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              📝 {routine.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function getTodayKey(): keyof WeeklyStretchingPlan['days'] | null {
  const dayMap: Record<number, keyof WeeklyStretchingPlan['days']> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };
  return dayMap[new Date().getDay()] || null;
}

function calculateWeeklyStats(plan: WeeklyStretchingPlan): {
  totalMinutes: number;
  totalExercises: number;
} {
  let totalMinutes = 0;
  let totalExercises = 0;

  for (const routine of Object.values(plan.days)) {
    totalMinutes += routine.duration;
    totalExercises += routine.stretches.length;
  }

  return { totalMinutes, totalExercises };
}

export default WeeklyStretchingPlanCard;
