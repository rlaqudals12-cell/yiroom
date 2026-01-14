'use client';

import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SkinDiaryEntry, SkinConditionScore } from '@/types/skin-diary';
import { CONDITION_EMOJIS, CONDITION_COLORS } from '@/types/skin-diary';

/**
 * 캘린더 Props
 */
export interface SkinDiaryCalendarProps {
  /** 피부 일기 엔트리 목록 */
  entries: SkinDiaryEntry[];
  /** 현재 선택된 날짜 */
  selectedDate: Date;
  /** 날짜 선택 핸들러 */
  onDateSelect: (date: Date) => void;
  /** 월 변경 핸들러 */
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

/**
 * 피부 다이어리 캘린더 컴포넌트
 * - 월간 캘린더 뷰
 * - 날짜별 피부 컨디션 이모지/색상 표시
 * - 날짜 선택 및 월 네비게이션
 */
const SkinDiaryCalendar = memo(function SkinDiaryCalendar({
  entries,
  selectedDate,
  onDateSelect,
  onMonthChange,
  className,
}: SkinDiaryCalendarProps) {
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());

  // selectedDate 변경 시 현재 연/월 업데이트
  useEffect(() => {
    setCurrentYear(selectedDate.getFullYear());
    setCurrentMonth(selectedDate.getMonth());
  }, [selectedDate]);

  // 날짜별 엔트리 맵 생성
  const entryMap = useMemo(() => {
    const map = new Map<string, SkinDiaryEntry>();
    for (const entry of entries) {
      const key = entry.entryDate.toISOString().split('T')[0];
      map.set(key, entry);
    }
    return map;
  }, [entries]);

  // 해당 월의 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // 요일 인덱스 조정 (일요일 시작: 0, 월요일 시작으로 변환)
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달 날짜
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }

    return days;
  }, [currentYear, currentMonth]);

  // 이전 달로 이동
  const goToPreviousMonth = useCallback(() => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth + 1);
  }, [currentMonth, currentYear, onMonthChange]);

  // 다음 달로 이동
  const goToNextMonth = useCallback(() => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth + 1);
  }, [currentMonth, currentYear, onMonthChange]);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    onDateSelect(today);
  }, [onDateSelect]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className={cn('space-y-4', className)} data-testid="skin-diary-calendar">
      {/* 헤더: 연/월 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth} aria-label="이전 달">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">
            {currentYear}년 {currentMonth + 1}월
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>

        <Button variant="ghost" size="icon" onClick={goToNextMonth} aria-label="다음 달">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-2 text-sm font-medium',
              index === 5 && 'text-blue-500', // 토요일
              index === 6 && 'text-red-500' // 일요일
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="피부 일기 캘린더">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = date.toISOString().split('T')[0];
          const entry = entryMap.get(dateKey);
          const isSelected =
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate();
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const isFuture = date > today;
          const dayOfWeek = date.getDay();

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => !isFuture && onDateSelect(date)}
              disabled={isFuture}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg transition-all',
                'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                isSelected && 'ring-2 ring-primary ring-offset-2 bg-muted',
                isToday && !isSelected && 'border-2 border-primary',
                isFuture && 'opacity-30 cursor-not-allowed',
                dayOfWeek === 0 && 'text-red-500',
                dayOfWeek === 6 && 'text-blue-500'
              )}
              aria-label={`${currentMonth + 1}월 ${date.getDate()}일${entry ? `, 피부 컨디션 ${entry.skinCondition}점` : ''}`}
              aria-pressed={isSelected}
              data-testid={`calendar-day-${date.getDate()}`}
            >
              <span className={cn('text-sm font-medium', isToday && 'font-bold')}>
                {date.getDate()}
              </span>

              {entry ? (
                <span
                  className="text-lg"
                  style={{
                    textShadow: `0 0 8px ${CONDITION_COLORS[entry.skinCondition as SkinConditionScore]}`,
                  }}
                  aria-hidden="true"
                >
                  {CONDITION_EMOJIS[entry.skinCondition as SkinConditionScore]}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground mt-1" aria-hidden="true">
                  {!isFuture ? '·' : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 pt-4 border-t">
        {([1, 2, 3, 4, 5] as SkinConditionScore[]).map((score) => (
          <div key={score} className="flex items-center gap-1 text-xs">
            <span>{CONDITION_EMOJIS[score]}</span>
            <span className="text-muted-foreground">{score}점</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SkinDiaryCalendar;
