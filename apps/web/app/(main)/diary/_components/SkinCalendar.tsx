'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalendarMonth, VitalityGrade } from '@/lib/skin-diary';

interface SkinCalendarProps {
  calendar: CalendarMonth;
  onMonthChange: (year: number, month: number) => void;
}

// S-2 바이탈리티 등급 색상 매핑
const GRADE_COLORS: Record<VitalityGrade, string> = {
  S: 'bg-emerald-500',
  A: 'bg-blue-500',
  B: 'bg-yellow-500',
  C: 'bg-orange-500',
  D: 'bg-red-500',
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function SkinCalendar({ calendar, onMonthChange }: SkinCalendarProps) {
  const { year, month, days } = calendar;

  // 월의 시작 요일 (0=일, 6=토)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const handlePrev = (): void => {
    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    onMonthChange(prev.y, prev.m);
  };

  const handleNext = (): void => {
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    onMonthChange(next.y, next.m);
  };

  return (
    <Card data-testid="skin-calendar">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrev} aria-label="이전 달">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">
            {year}년 {month}월
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNext} aria-label="다음 달">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-xs text-muted-foreground py-1">
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 격자 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 빈 칸 (월 시작 전) */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* 날짜 */}
          {days.map((day) => {
            const dayNum = parseInt(day.date.split('-')[2], 10);
            return (
              <div
                key={day.date}
                className={`aspect-square flex flex-col items-center justify-center rounded-md text-xs relative
                  ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                  ${day.hasAssessment ? 'font-medium' : 'text-muted-foreground'}
                `}
              >
                <span>{dayNum}</span>
                {day.hasAssessment && day.vitalityGrade && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${GRADE_COLORS[day.vitalityGrade]} mt-0.5`}
                    title={`${day.vitalityGrade}등급`}
                  />
                )}
                {day.conditionEmoji && (
                  <span className="text-[8px] absolute -top-0.5 -right-0.5">
                    {day.conditionEmoji}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t justify-center">
          {(['S', 'A', 'B', 'C', 'D'] as VitalityGrade[]).map((grade) => (
            <div key={grade} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${GRADE_COLORS[grade]}`} />
              <span className="text-xs text-muted-foreground">{grade}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
