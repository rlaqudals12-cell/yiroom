'use client';

import type { DayPlan, WorkoutType } from '@/types/workout';
import { WORKOUT_TYPE_INFO } from '@/lib/workout/classifyWorkoutType';
import { Calendar } from 'lucide-react';

// 요일 한글 라벨
const DAY_LABELS: Record<string, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

// 카테고리 한글 라벨 (캘린더 표시용 - 스펙 6.5)
const CATEGORY_LABELS: Record<string, string> = {
  upper: '상체',
  lower: '하체',
  core: '코어',
  cardio: '유산소',
};

interface WeeklyPlanCardProps {
  days: DayPlan[];
  workoutType: WorkoutType;
  weekStartDate: string;
  onDayClick?: (day: DayPlan) => void;
  selectedDay?: string;
}

export function WeeklyPlanCard({
  days,
  workoutType,
  weekStartDate,
  onDayClick,
  selectedDay,
}: WeeklyPlanCardProps) {
  const typeInfo = WORKOUT_TYPE_INFO[workoutType];

  // 오늘 요일 확인
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek];

  // 주차 계산
  const startDate = new Date(weekStartDate);
  const weekNumber = Math.ceil(startDate.getDate() / 7);
  const monthName = startDate.toLocaleDateString('ko-KR', { month: 'long' });

  // 포커스 카테고리 라벨 생성 (캘린더 표시용 - 스펙 6.5)
  const getFocusLabel = (day: DayPlan): string => {
    if (day.isRestDay) return '휴식';

    // categories 우선 사용 (스펙에 맞는 간략한 표시)
    if (day.categories && day.categories.length > 0) {
      const labels = day.categories.slice(0, 2).map((c) => CATEGORY_LABELS[c] || c);
      return labels.join('/');
    }

    // categories가 없으면 전신으로 표시
    return '전신';
  };

  // 상태 아이콘 및 색상
  const getDayStatus = (day: DayPlan) => {
    const isToday = day.day === todayKey;

    if (day.isRestDay) {
      return {
        icon: '⬜',
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
        borderColor: isToday ? 'ring-2 ring-muted-foreground' : '',
      };
    }

    // 현재는 예정 상태로만 표시 (운동 기록 연동 전)
    if (isToday) {
      return {
        icon: '🔴',
        bgColor: 'bg-red-50',
        textColor: 'text-red-600',
        borderColor: 'ring-2 ring-red-400',
      };
    }

    return {
      icon: '📋',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: '',
    };
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
      data-testid="weekly-plan-card"
    >
      {/* 헤더 */}
      <div className={`px-5 py-4 ${typeInfo.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className={`w-5 h-5 ${typeInfo.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{monthName} {weekNumber}주차</h3>
            <p className="text-sm text-muted-foreground">
              {typeInfo.label} 타입 주간 플랜
            </p>
          </div>
        </div>
      </div>

      {/* 주간 캘린더 */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const status = getDayStatus(day);
            const isSelected = selectedDay === day.day;

            return (
              <button
                key={day.day}
                onClick={() => onDayClick?.(day)}
                className={`
                  flex flex-col items-center p-2 rounded-xl transition-all
                  ${status.bgColor} ${status.borderColor}
                  ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-100' : ''}
                  ${!day.isRestDay ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                `}
              >
                <span className="text-xs font-medium text-muted-foreground mb-1">
                  {DAY_LABELS[day.day]}
                </span>
                <span className="text-lg mb-1">{status.icon}</span>
                <span className={`text-xs font-medium ${status.textColor} truncate w-full text-center`}>
                  {getFocusLabel(day)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span>예정</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔴</span>
            <span>오늘</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⬜</span>
            <span>휴식</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span>완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}
