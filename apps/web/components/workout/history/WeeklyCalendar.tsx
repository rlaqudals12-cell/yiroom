'use client';

import { useMemo } from 'react';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import { Flame, Check, X, Circle } from 'lucide-react';

interface WorkoutDay {
  date: string;          // YYYY-MM-DD
  status: 'completed' | 'skipped' | 'rest' | 'planned' | 'today';
  label?: string;        // 상체, 하체 등
}

interface WeeklyCalendarProps {
  weekDays: WorkoutDay[];
  currentStreak?: number;
  onDayClick?: (date: string) => void;
}

/**
 * 주간 캘린더 컴포넌트
 * - 7일 운동 현황 표시
 * - Streak 표시
 * - 상태별 아이콘/색상
 */
export function WeeklyCalendar({
  weekDays,
  currentStreak = 0,
  onDayClick,
}: WeeklyCalendarProps) {
  // 요일 라벨
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  // 상태별 스타일
  const getStatusStyle = (status: WorkoutDay['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'skipped':
        return 'bg-red-100 text-red-500 border border-red-200';
      case 'rest':
        return 'bg-muted text-muted-foreground';
      case 'today':
        return 'bg-indigo-500 text-white ring-2 ring-indigo-300';
      case 'planned':
        return 'bg-indigo-100 text-indigo-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: WorkoutDay['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />;
      case 'skipped':
        return <X className="w-4 h-4" />;
      case 'today':
        return <Circle className="w-4 h-4 fill-current" />;
      default:
        return null;
    }
  };

  // 주차 계산
  const weekLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const firstDay = new Date(weekDays[0].date);
    const month = firstDay.getMonth() + 1;
    const weekOfMonth = Math.ceil(firstDay.getDate() / 7);
    return `${month}월 ${weekOfMonth}주차`;
  }, [weekDays]);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm" data-testid="weekly-calendar">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">📅 {weekLabel}</span>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {currentStreak}일 연속!
            </span>
          </div>
        )}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {/* 요일 헤더 */}
        {dayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground pb-2"
          >
            {label}
          </div>
        ))}

        {/* 날짜 셀 */}
        {weekDays.map((day) => (
          <button
            key={day.date}
            onClick={() => onDayClick?.(day.date)}
            className={`
              aspect-square rounded-xl flex flex-col items-center justify-center
              transition-all hover:scale-105 cursor-pointer
              ${getStatusStyle(day.status)}
            `}
            aria-label={`${day.date} ${selectByKey(day.status, {
              completed: '완료',
              skipped: '미완료',
              today: '오늘',
              planned: '예정',
            }, '휴식')}`}
          >
            {getStatusIcon(day.status)}
          </button>
        ))}

        {/* 라벨 (운동 종류) */}
        {weekDays.map((day) => (
          <div
            key={`label-${day.date}`}
            className="text-center text-xs text-muted-foreground truncate px-1"
          >
            {day.label || (day.status === 'rest' ? '휴식' : '')}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-border flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-muted-foreground">완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-border" />
          <span className="text-xs text-muted-foreground">휴식</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-500" />
          <span className="text-xs text-muted-foreground">오늘</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200" />
          <span className="text-xs text-muted-foreground">예정</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-xs text-muted-foreground">미완료</span>
        </div>
      </div>
    </div>
  );
}
