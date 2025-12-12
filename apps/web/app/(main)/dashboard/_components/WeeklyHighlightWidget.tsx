'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Droplets,
  Dumbbell,
  ChevronRight,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WeeklyReport } from '@/types/report';

/**
 * 대시보드 주간 하이라이트 위젯
 * - 이번 주 칼로리/수분/운동 요약
 * - 리포트 페이지로 바로가기
 */
export default function WeeklyHighlightWidget() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');

  useEffect(() => {
    // 현재 주 시작일 계산 (월요일 기준)
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];
    setCurrentWeekStart(weekStart);

    // 주간 리포트 데이터 로드
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/weekly?weekStart=${weekStart}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setReport(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch weekly report:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, []);

  // 로딩 상태
  if (isLoading) {
    return (
      <Card data-testid="weekly-highlight-loading">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            이번 주 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 데이터 없음 상태
  if (!report || report.nutrition.summary.daysWithRecords === 0) {
    return (
      <Card data-testid="weekly-highlight-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            이번 주 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              이번 주 기록이 아직 없습니다
            </p>
            <Link
              href="/nutrition"
              className="text-sm text-primary hover:underline"
            >
              식단 기록 시작하기 &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { nutrition, workout, streak } = report;

  return (
    <Card data-testid="weekly-highlight-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            이번 주 요약
          </CardTitle>
          <Link
            href={`/reports/weekly/${currentWeekStart}`}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            상세보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* 평균 칼로리 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-module-nutrition-light mb-2">
              <Flame className="h-5 w-5 text-module-nutrition" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(nutrition.summary.avgCaloriesPerDay).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">평균 칼로리</p>
          </div>

          {/* 평균 수분 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-status-info/20 mb-2">
              <Droplets className="h-5 w-5 text-status-info" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {(nutrition.summary.avgWaterPerDay / 1000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">평균 수분</p>
          </div>

          {/* 운동 횟수 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-module-workout-light mb-2">
              <Dumbbell className="h-5 w-5 text-module-workout" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {workout.summary.totalSessions}회
            </p>
            <p className="text-xs text-muted-foreground">운동 횟수</p>
          </div>
        </div>

        {/* 스트릭 정보 */}
        {(streak.nutrition.current > 0 || streak.workout.current > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-sm">
              {streak.nutrition.current > 0 && (
                <span className="flex items-center gap-1 text-module-nutrition">
                  <span>🔥</span>
                  <span>식단 {streak.nutrition.current}일 연속</span>
                </span>
              )}
              {streak.workout.current > 0 && (
                <span className="flex items-center gap-1 text-module-workout">
                  <span>💪</span>
                  <span>운동 {streak.workout.current}일 연속</span>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
