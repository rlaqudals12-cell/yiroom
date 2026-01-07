/**
 * R-2 월간 리포트 페이지
 * Task R-2.3: 월간 리포트 UI
 *
 * /reports/monthly/[month]
 * - 해당 월의 영양/운동 리포트 표시
 * - 주간 비교 차트
 * - 체중 변화 및 목표 진행률
 */

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  ReportHeader,
  NutritionSummaryCard,
  WorkoutSummaryCard,
  InsightCard,
  StreakBadge,
  CalorieTrendChartDynamic,
  WeeklyComparisonChartDynamic,
  BodyProgressCard,
  GoalProgressCard,
  BeautyNutritionCard,
} from '@/components/reports';
import { EmptyStateCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import type { MonthlyReport, MonthlyReportResponse } from '@/types/report';

interface MonthlyReportPageProps {
  params: Promise<{ month: string }>;
}

export default function MonthlyReportPage({ params }: MonthlyReportPageProps) {
  const { month } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    fetchReport(month);
  }, [month]);

  async function fetchReport(yearMonth: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/monthly?month=${yearMonth}`);
      const data: MonthlyReportResponse = await res.json();

      if (!data.success) {
        setError(data.error || '리포트를 불러오는데 실패했습니다.');
        return;
      }

      if (!data.hasData) {
        setHasData(false);
        return;
      }

      setHasData(true);
      setReport(data.data || null);
    } catch (err) {
      console.error('[R-2] Monthly report fetch error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function navigateToPreviousMonth() {
    const prevMonth = getPreviousMonth(month);
    router.push(`/reports/monthly/${prevMonth}`);
  }

  function navigateToNextMonth() {
    const nextMonth = getNextMonth(month);
    router.push(`/reports/monthly/${nextMonth}`);
  }

  function handleBodyReanalyze() {
    router.push('/analysis/body');
  }

  const canGoNext = !isCurrentOrFutureMonth(month);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">리포트를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => fetchReport(month)}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <ReportHeader
          title={formatMonthTitle(month)}
          subtitle="월간 리포트"
          onPrevious={navigateToPreviousMonth}
          onNext={navigateToNextMonth}
          canGoNext={canGoNext}
        />

        <EmptyStateCard
          preset="report"
          title="이번 달 기록이 없어요"
          description="식단이나 운동을 기록하면 월간 리포트를 받아볼 수 있어요."
          actionLabel="식단 기록하기"
          actionHref="/nutrition"
          secondaryActionLabel="운동 기록하기"
          secondaryActionHref="/workout"
          className="mt-8"
          data-testid="monthly-report-empty"
        />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const targetCalories = report.nutrition.dailyBreakdown[0]?.calorieTarget || 2000;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="monthly-report-page">
      {/* 헤더 */}
      <ReportHeader
        title={formatMonthTitle(month)}
        subtitle="월간 리포트"
        onPrevious={navigateToPreviousMonth}
        onNext={navigateToNextMonth}
        canGoNext={canGoNext}
      />

      {/* 리포트 내용 */}
      <div className="space-y-4">
        {/* 목표 진행률 */}
        <GoalProgressCard goalProgress={report.goalProgress} />

        {/* 영양 요약 */}
        <NutritionSummaryCard
          summary={report.nutrition.summary}
          achievement={report.nutrition.achievement}
        />

        {/* 운동 요약 */}
        <WorkoutSummaryCard
          summary={report.workout.summary}
          trend={report.workout.trend}
          hasData={report.workout.hasData}
        />

        {/* 주간 비교 차트 (Dynamic Import) */}
        <WeeklyComparisonChartDynamic
          weeklyData={report.weeklyComparison}
          highlights={report.highlights}
        />

        {/* 칼로리 트렌드 차트 (Dynamic Import) */}
        <CalorieTrendChartDynamic
          dailyData={report.nutrition.dailyBreakdown}
          trend={report.nutrition.trend.caloriesTrend}
          targetCalories={targetCalories}
        />

        {/* 체중 변화 */}
        <BodyProgressCard bodyProgress={report.bodyProgress} onReanalyze={handleBodyReanalyze} />

        {/* 인사이트 */}
        <InsightCard insights={report.insights} />

        {/* 뷰티-영양 상관관계 (H-1/M-1 연동) */}
        {report.beautyNutritionCorrelation && (
          <BeautyNutritionCard correlation={report.beautyNutritionCorrelation} />
        )}

        {/* 스트릭 */}
        <StreakBadge
          nutritionStreak={report.streak.nutrition}
          workoutStreak={report.streak.workout}
        />
      </div>
    </div>
  );
}

// 유틸리티 함수
function formatMonthTitle(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}년 ${parseInt(month, 10)}월`;
}

function getPreviousMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

function getNextMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month, 1));
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

function isCurrentOrFutureMonth(yearMonth: string): boolean {
  const [year, month] = yearMonth.split('-').map(Number);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) return true;
  if (year === currentYear && month >= currentMonth) return true;
  return false;
}
