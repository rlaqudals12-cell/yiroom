/**
 * R-1 주간 리포트 페이지
 * Task R-1.4: 주간 리포트 UI
 *
 * /reports/weekly/[weekStart]
 * - 해당 주의 영양/운동 리포트 표시
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
  BeautyNutritionCard,
  ReportSummaryCard,
  BestDayHighlightCard,
  CalorieBalanceCard,
} from '@/components/reports';
import { EmptyStateCard } from '@/components/common';
import { ShareButton } from '@/components/share/ShareButton';
import { PrintButton } from '@/components/share/PrintButton';
import { Button } from '@/components/ui/button';
import { useShare } from '@/hooks/useShare';
import type { WeeklyReport, WeeklyReportResponse } from '@/types/report';

interface WeeklyReportPageProps {
  params: Promise<{ weekStart: string }>;
}

export default function WeeklyReportPage({ params }: WeeklyReportPageProps) {
  const { weekStart } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(true);
  const { ref: shareRef, share, loading: shareLoading } = useShare('이룸-주간-리포트');

  useEffect(() => {
    fetchReport(weekStart);
  }, [weekStart]);

  async function fetchReport(week: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/weekly?weekStart=${week}`);
      const data: WeeklyReportResponse = await res.json();

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
      console.error('[R-1] Weekly report fetch error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function navigateToPreviousWeek() {
    const prevWeek = getPreviousWeek(weekStart);
    router.push(`/reports/weekly/${prevWeek}`);
  }

  function navigateToNextWeek() {
    const nextWeek = getNextWeek(weekStart);
    router.push(`/reports/weekly/${nextWeek}`);
  }

  const canGoNext = !isCurrentOrFutureWeek(weekStart);

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
        <Button variant="outline" onClick={() => fetchReport(weekStart)}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6">
        <ReportHeader
          title={formatWeekRange(weekStart)}
          subtitle="주간 리포트"
          onPrevious={navigateToPreviousWeek}
          onNext={navigateToNextWeek}
          canGoNext={canGoNext}
        />

        <EmptyStateCard
          preset="report"
          title="이번 주 기록이 없어요"
          description="식단이나 운동을 기록하면 주간 리포트를 받아볼 수 있어요."
          actionLabel="식단 기록하기"
          actionHref="/nutrition"
          secondaryActionLabel="운동 기록하기"
          secondaryActionHref="/workout"
          className="mt-8"
          data-testid="weekly-report-empty"
        />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const targetCalories = report.nutrition.dailyBreakdown[0]?.calorieTarget || 2000;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="weekly-report-page">
      {/* 헤더 */}
      <ReportHeader
        title={formatWeekRange(weekStart)}
        subtitle="주간 리포트"
        onPrevious={navigateToPreviousWeek}
        onNext={navigateToNextWeek}
        canGoNext={canGoNext}
      />

      {/* 공유/인쇄 버튼 */}
      <div className="flex justify-end gap-1 mb-4" data-print-hide>
        <ShareButton onShare={share} loading={shareLoading} variant="outline" size="sm" />
        <PrintButton title={`이룸 주간 리포트 ${weekStart}`} variant="outline" size="sm" />
      </div>

      {/* 리포트 내용 */}
      <div ref={shareRef} className="space-y-4">
        {/* 맞춤 요약 (Phase 3) */}
        <ReportSummaryCard
          periodLabel="이번 주"
          achievement={report.nutrition.achievement}
          trend={report.nutrition.trend}
          workoutSummary={report.workout.summary}
          calorieBalanceStatus={report.calorieBalance.status}
          hasWorkoutData={report.workout.hasData}
        />

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

        {/* 칼로리 밸런스 (Phase 3) */}
        <CalorieBalanceCard
          totalIntake={report.calorieBalance.totalIntake}
          totalBurned={report.calorieBalance.totalBurned}
          netCalories={report.calorieBalance.netCalories}
          status={report.calorieBalance.status}
          avgNetPerDay={report.calorieBalance.avgNetPerDay}
        />

        {/* 칼로리 트렌드 차트 (Dynamic Import) */}
        <CalorieTrendChartDynamic
          dailyData={report.nutrition.dailyBreakdown}
          trend={report.nutrition.trend.caloriesTrend}
          targetCalories={targetCalories}
        />

        {/* 베스트 데이 하이라이트 (Phase 3) */}
        <BestDayHighlightCard
          bestDay={report.highlights.bestDay}
          bestDayScore={report.highlights.bestDayScore}
          worstDay={report.highlights.worstDay}
          worstDayScore={report.highlights.worstDayScore}
        />

        {/* 인사이트 */}
        <InsightCard insights={report.insights} />

        {/* 뷰티-영양 상관관계 (H-1/M-1 연동) */}
        {report.beautyNutritionCorrelation ? (
          <BeautyNutritionCard correlation={report.beautyNutritionCorrelation} />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
            <p>뷰티 분석을 완료하면 영양과의 상관관계를 확인할 수 있어요</p>
          </div>
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
function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}월 ${startDay}일 - ${endDay}일`;
  }
  return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
}

function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

function isCurrentOrFutureWeek(weekStart: string): boolean {
  const today = new Date();
  const weekStartDate = new Date(weekStart);
  const currentWeekStart = getThisWeekStart(today);

  return weekStartDate >= currentWeekStart;
}

function getThisWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
