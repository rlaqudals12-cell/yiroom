'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Utensils,
  ChevronRight,
  Loader2,
  AlertCircle,
  Flame,
} from 'lucide-react';
import {
  NutritionSummaryCard,
  WorkoutSummaryCard,
  InsightCard,
  StreakBadge,
  CalorieTrendChartDynamic,
  BeautyNutritionCard,
  GoalProgressCard,
  ReportSummaryCard,
  BestDayHighlightCard,
  BestWeekHighlightCard,
  CalorieBalanceCard,
} from '@/components/reports';
import { EmptyStateCard } from '@/components/common';
import { ShareButton } from '@/components/share/ShareButton';
import { PrintButton } from '@/components/share/PrintButton';
import { Button } from '@/components/ui/button';
import { FadeInUp } from '@/components/animations';
import { useShare } from '@/hooks/useShare';
import { cn } from '@/lib/utils';
import type {
  WeeklyReport,
  MonthlyReport,
  WeeklyReportResponse,
  MonthlyReportResponse,
} from '@/types/report';

/**
 * 상세 리포트 페이지
 * - 주간/월간 탭 전환
 * - 실제 API 데이터 기반
 * - 3-state: 로딩 / 에러 / 빈 상태
 */

type PeriodType = 'weekly' | 'monthly';

export default function ReportPage(): React.ReactElement {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const {
    ref: shareRef,
    share,
    loading: shareLoading,
  } = useShare(`이룸-${period === 'weekly' ? '주간' : '월간'}-리포트`);

  // 주간 리포트 상태
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklyHasData, setWeeklyHasData] = useState(true);

  // 월간 리포트 상태
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [monthlyHasData, setMonthlyHasData] = useState(true);

  const fetchWeeklyReport = useCallback(async () => {
    setWeeklyLoading(true);
    setWeeklyError(null);
    try {
      const res = await fetch('/api/reports/weekly');
      const data: WeeklyReportResponse = await res.json();
      if (!data.success) {
        setWeeklyError(data.error || '리포트를 불러올 수 없어요');
        return;
      }
      if (!data.hasData) {
        setWeeklyHasData(false);
        return;
      }
      setWeeklyHasData(true);
      setWeeklyReport(data.data || null);
    } catch {
      setWeeklyError('네트워크 오류가 발생했어요');
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  const fetchMonthlyReport = useCallback(async () => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const res = await fetch('/api/reports/monthly');
      const data: MonthlyReportResponse = await res.json();
      if (!data.success) {
        setMonthlyError(data.error || '리포트를 불러올 수 없어요');
        return;
      }
      if (!data.hasData) {
        setMonthlyHasData(false);
        return;
      }
      setMonthlyHasData(true);
      setMonthlyReport(data.data || null);
    } catch {
      setMonthlyError('네트워크 오류가 발생했어요');
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  // 초기 로드: 주간
  useEffect(() => {
    fetchWeeklyReport();
  }, [fetchWeeklyReport]);

  // 월간 탭 클릭 시 lazy fetch
  useEffect(() => {
    if (period === 'monthly' && !monthlyReport && !monthlyLoading && !monthlyError) {
      fetchMonthlyReport();
    }
  }, [period, monthlyReport, monthlyLoading, monthlyError, fetchMonthlyReport]);

  const loading = period === 'weekly' ? weeklyLoading : monthlyLoading;
  const error = period === 'weekly' ? weeklyError : monthlyError;
  const hasData = period === 'weekly' ? weeklyHasData : monthlyHasData;
  const retry = period === 'weekly' ? fetchWeeklyReport : fetchMonthlyReport;

  return (
    <div className="min-h-screen bg-background pb-6" data-testid="report-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">상세 리포트</h1>
          </div>
          <div className="flex items-center gap-1" data-print-hide>
            <ShareButton onShare={share} loading={shareLoading} variant="ghost" size="sm" />
            <PrintButton
              title={`이룸 ${period === 'weekly' ? '주간' : '월간'} 리포트`}
              variant="ghost"
              size="icon"
            />
          </div>
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-2 px-4 py-2">
          {[
            { id: 'weekly' as PeriodType, label: '주간' },
            { id: 'monthly' as PeriodType, label: '월간' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
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

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">리포트를 불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={retry}>
            다시 시도
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && !hasData && (
        <div className="px-4 py-8">
          <EmptyStateCard
            preset="report"
            title={period === 'weekly' ? '이번 주 기록이 없어요' : '이번 달 기록이 없어요'}
            description="식단이나 운동을 기록하면 리포트를 받아볼 수 있어요"
            actionLabel="식단 기록하기"
            actionHref="/nutrition"
            secondaryActionLabel="운동 기록하기"
            secondaryActionHref="/workout"
            data-testid="report-empty"
          />
        </div>
      )}

      {/* 리포트 콘텐츠 (공유 캡처 대상) */}
      <div ref={shareRef}>
        {/* 주간 리포트 */}
        {!loading && !error && hasData && period === 'weekly' && weeklyReport && (
          <WeeklyReportContent report={weeklyReport} />
        )}

        {/* 월간 리포트 */}
        {!loading && !error && hasData && period === 'monthly' && monthlyReport && (
          <MonthlyReportContent report={monthlyReport} />
        )}
      </div>

      {/* 상세 기록 보기 링크 */}
      {!loading && !error && hasData && (
        <div className="px-4 pt-2 space-y-2">
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
      )}

      {/* 비의료 고지 (D10) */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-xs text-center text-muted-foreground">
          이 리포트는 건강 참고 자료이며, 의료 조언을 대체하지 않아요
        </p>
      </div>
    </div>
  );
}

// 주간 리포트 콘텐츠
function WeeklyReportContent({ report }: { report: WeeklyReport }): React.ReactElement {
  const targetCalories = report.nutrition.dailyBreakdown[0]?.calorieTarget || 2000;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 맞춤 요약 (Phase 3) */}
      <FadeInUp>
        <ReportSummaryCard
          periodLabel="이번 주"
          achievement={report.nutrition.achievement}
          trend={report.nutrition.trend}
          workoutSummary={report.workout.summary}
          calorieBalanceStatus={report.calorieBalance.status}
          hasWorkoutData={report.workout.hasData}
        />
      </FadeInUp>

      <FadeInUp delay={1}>
        <NutritionSummaryCard
          summary={report.nutrition.summary}
          achievement={report.nutrition.achievement}
        />
      </FadeInUp>

      <FadeInUp delay={2}>
        <WorkoutSummaryCard
          summary={report.workout.summary}
          trend={report.workout.trend}
          hasData={report.workout.hasData}
        />
      </FadeInUp>

      {/* 칼로리 밸런스 (Phase 3) */}
      <FadeInUp delay={3}>
        <CalorieBalanceCard
          totalIntake={report.calorieBalance.totalIntake}
          totalBurned={report.calorieBalance.totalBurned}
          netCalories={report.calorieBalance.netCalories}
          status={report.calorieBalance.status}
          avgNetPerDay={report.calorieBalance.avgNetPerDay}
        />
      </FadeInUp>

      <FadeInUp delay={4}>
        <CalorieTrendChartDynamic
          dailyData={report.nutrition.dailyBreakdown}
          trend={report.nutrition.trend.caloriesTrend}
          targetCalories={targetCalories}
        />
      </FadeInUp>

      {/* 베스트 데이 하이라이트 (Phase 3) */}
      <FadeInUp delay={5}>
        <BestDayHighlightCard
          bestDay={report.highlights.bestDay}
          bestDayScore={report.highlights.bestDayScore}
          worstDay={report.highlights.worstDay}
          worstDayScore={report.highlights.worstDayScore}
        />
      </FadeInUp>

      <FadeInUp delay={6}>
        <InsightCard insights={report.insights} />
      </FadeInUp>

      {/* 뷰티-영양 상관관계 */}
      <FadeInUp delay={7}>
        {report.beautyNutritionCorrelation ? (
          <BeautyNutritionCard correlation={report.beautyNutritionCorrelation} />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
            <p>뷰티 분석을 완료하면 영양과의 상관관계를 확인할 수 있어요</p>
          </div>
        )}
      </FadeInUp>

      <FadeInUp delay={8}>
        <StreakBadge
          nutritionStreak={report.streak.nutrition}
          workoutStreak={report.streak.workout}
        />
      </FadeInUp>
    </div>
  );
}

// 월간 리포트 콘텐츠
function MonthlyReportContent({ report }: { report: MonthlyReport }): React.ReactElement {
  const targetCalories = report.nutrition.dailyBreakdown[0]?.calorieTarget || 2000;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 맞춤 요약 (Phase 3) */}
      <FadeInUp>
        <ReportSummaryCard
          periodLabel="이번 달"
          achievement={report.nutrition.achievement}
          trend={report.nutrition.trend}
          workoutSummary={report.workout.summary}
          calorieBalanceStatus={report.calorieBalance.status}
          hasWorkoutData={report.workout.hasData}
        />
      </FadeInUp>

      <FadeInUp delay={1}>
        <NutritionSummaryCard
          summary={report.nutrition.summary}
          achievement={report.nutrition.achievement}
        />
      </FadeInUp>

      <FadeInUp delay={2}>
        <WorkoutSummaryCard
          summary={report.workout.summary}
          trend={report.workout.trend}
          hasData={report.workout.hasData}
        />
      </FadeInUp>

      {/* 칼로리 밸런스 (Phase 3) */}
      <FadeInUp delay={3}>
        <CalorieBalanceCard
          totalIntake={report.calorieBalance.totalIntake}
          totalBurned={report.calorieBalance.totalBurned}
          netCalories={report.calorieBalance.netCalories}
          status={report.calorieBalance.status}
          avgNetPerDay={report.calorieBalance.avgNetPerDay}
        />
      </FadeInUp>

      <FadeInUp delay={4}>
        <CalorieTrendChartDynamic
          dailyData={report.nutrition.dailyBreakdown}
          trend={report.nutrition.trend.caloriesTrend}
          targetCalories={targetCalories}
        />
      </FadeInUp>

      {/* 목표 진행률 (월간만) */}
      <FadeInUp delay={5}>
        <GoalProgressCard goalProgress={report.goalProgress} />
      </FadeInUp>

      {/* 베스트 위크 하이라이트 (Phase 4 — 월간만) */}
      <FadeInUp delay={6}>
        <BestWeekHighlightCard
          bestWeek={report.highlights.bestWeek}
          bestWeekScore={report.highlights.bestWeekScore}
          worstWeek={report.highlights.worstWeek}
          worstWeekScore={report.highlights.worstWeekScore}
        />
      </FadeInUp>

      <FadeInUp delay={7}>
        <InsightCard insights={report.insights} />
      </FadeInUp>

      {/* 뷰티-영양 상관관계 */}
      <FadeInUp delay={8}>
        {report.beautyNutritionCorrelation ? (
          <BeautyNutritionCard correlation={report.beautyNutritionCorrelation} />
        ) : (
          <section className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
            <Flame className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p>뷰티 분석을 완료하면 영양과의 상관관계를 확인할 수 있어요</p>
          </section>
        )}
      </FadeInUp>

      <FadeInUp delay={9}>
        <StreakBadge
          nutritionStreak={report.streak.nutrition}
          workoutStreak={report.streak.workout}
        />
      </FadeInUp>
    </div>
  );
}
