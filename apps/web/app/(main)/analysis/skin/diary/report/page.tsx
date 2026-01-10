'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CorrelationChart, FactorTrendChart } from '@/components/skin/diary';
import type {
  SkinDiaryEntry,
  MonthlyReport,
  CorrelationInsight,
  WeeklyAverage,
  DbSkinDiaryEntry,
  SkinConditionScore,
} from '@/types/skin-diary';
import { CONDITION_EMOJIS, CONDITION_COLORS } from '@/types/skin-diary';
import { analyzeCorrelations } from '@/lib/skincare/correlation';
import { DEFAULT_INSIGHTS } from '@/lib/mock/skin-diary';

// DB 엔트리를 앱 엔트리로 변환
function transformDbToEntry(dbEntry: DbSkinDiaryEntry): SkinDiaryEntry {
  return {
    id: dbEntry.id,
    clerkUserId: dbEntry.clerk_user_id,
    entryDate: new Date(dbEntry.entry_date),
    skinCondition: dbEntry.skin_condition as SkinConditionScore,
    conditionNotes: dbEntry.condition_notes ?? undefined,
    sleepHours: dbEntry.sleep_hours ?? undefined,
    sleepQuality: dbEntry.sleep_quality as SkinDiaryEntry['sleepQuality'],
    waterIntakeMl: dbEntry.water_intake_ml ?? undefined,
    stressLevel: dbEntry.stress_level as SkinDiaryEntry['stressLevel'],
    weather: dbEntry.weather as SkinDiaryEntry['weather'],
    outdoorHours: dbEntry.outdoor_hours ?? undefined,
    morningRoutineCompleted: dbEntry.morning_routine_completed,
    eveningRoutineCompleted: dbEntry.evening_routine_completed,
    specialTreatments: dbEntry.special_treatments ?? [],
    aiCorrelationScore: dbEntry.ai_correlation_score ?? undefined,
    aiInsights: dbEntry.ai_insights ?? undefined,
    createdAt: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
  };
}

// 주 시작일 계산 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SkinDiaryReportPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [entries, setEntries] = useState<SkinDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'correlations'>('overview');

  // 월별 엔트리 로드
  const loadEntries = useCallback(
    async (year: number, month: number) => {
      try {
        setLoading(true);
        setError(null);

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const { data, error: err } = await supabase
          .from('skin_diary_entries')
          .select('*')
          .gte('entry_date', startDate.toISOString().split('T')[0])
          .lte('entry_date', endDate.toISOString().split('T')[0])
          .order('entry_date', { ascending: true });

        if (err) throw err;

        const transformedEntries = ((data as DbSkinDiaryEntry[]) || []).map(transformDbToEntry);
        setEntries(transformedEntries);
      } catch (err) {
        console.error('[DiaryReport] Load error:', err);
        setError('리포트를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // 초기 로드
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadEntries(currentYear, currentMonth);
    }
  }, [isLoaded, isSignedIn, loadEntries, currentYear, currentMonth]);

  // 이전/다음 달 이동
  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  // 상관관계 인사이트
  const correlationInsights = useMemo<CorrelationInsight[]>(() => {
    if (entries.length < 7) {
      return DEFAULT_INSIGHTS;
    }
    return analyzeCorrelations(entries, '30days');
  }, [entries]);

  // 주간 평균 계산
  const weeklyAverages = useMemo<WeeklyAverage[]>(() => {
    if (entries.length === 0) return [];

    const weekMap = new Map<string, SkinDiaryEntry[]>();

    for (const entry of entries) {
      const weekStart = getWeekStart(entry.entryDate);
      const key = weekStart.toISOString().split('T')[0];
      if (!weekMap.has(key)) {
        weekMap.set(key, []);
      }
      weekMap.get(key)!.push(entry);
    }

    const averages: WeeklyAverage[] = [];
    for (const [key, weekEntries] of weekMap) {
      const total = weekEntries.reduce((sum, e) => sum + e.skinCondition, 0);
      averages.push({
        weekStart: new Date(key),
        avgCondition: Math.round((total / weekEntries.length) * 10) / 10,
        entriesCount: weekEntries.length,
      });
    }

    return averages.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  }, [entries]);

  // 월간 리포트 계산
  const monthlyReport = useMemo<MonthlyReport | null>(() => {
    if (entries.length === 0) {
      return null;
    }

    const totalCondition = entries.reduce((sum, e) => sum + e.skinCondition, 0);
    const avgCondition = totalCondition / entries.length;

    let bestDay: Date | null = null;
    let worstDay: Date | null = null;
    let bestScore = 0;
    let worstScore = 6;

    for (const entry of entries) {
      if (entry.skinCondition > bestScore) {
        bestScore = entry.skinCondition;
        bestDay = entry.entryDate;
      }
      if (entry.skinCondition < worstScore) {
        worstScore = entry.skinCondition;
        worstDay = entry.entryDate;
      }
    }

    const morningCount = entries.filter((e) => e.morningRoutineCompleted).length;
    const eveningCount = entries.filter((e) => e.eveningRoutineCompleted).length;

    // 트렌드 계산
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (weeklyAverages.length >= 2) {
      const first = weeklyAverages[0].avgCondition;
      const last = weeklyAverages[weeklyAverages.length - 1].avgCondition;
      if (last - first > 0.3) trendDirection = 'improving';
      else if (last - first < -0.3) trendDirection = 'declining';
    }

    return {
      month: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
      totalEntries: entries.length,
      avgCondition: Math.round(avgCondition * 10) / 10,
      bestDay,
      worstDay,
      topFactors: correlationInsights.slice(0, 3),
      routineCompletionRate: {
        morning: entries.length > 0 ? Math.round((morningCount / entries.length) * 100) : 0,
        evening: entries.length > 0 ? Math.round((eveningCount / entries.length) * 100) : 0,
      },
      trendDirection,
      weeklyAverages,
    };
  }, [entries, correlationInsights, weeklyAverages, currentYear, currentMonth]);

  // 로딩/인증 체크
  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/sign-in')}>로그인</Button>
        </div>
      </main>
    );
  }

  // 트렌드 아이콘/색상
  const TrendIcon =
    monthlyReport?.trendDirection === 'improving'
      ? TrendingUp
      : monthlyReport?.trendDirection === 'declining'
        ? TrendingDown
        : Minus;
  const trendColor =
    monthlyReport?.trendDirection === 'improving'
      ? 'text-green-500'
      : monthlyReport?.trendDirection === 'declining'
        ? 'text-red-500'
        : 'text-muted-foreground';
  const trendLabel =
    monthlyReport?.trendDirection === 'improving'
      ? '개선 중'
      : monthlyReport?.trendDirection === 'declining'
        ? '주의 필요'
        : '안정적';

  return (
    <main className="min-h-[calc(100vh-80px)] bg-muted" data-testid="skin-diary-report-page">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <header className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">월간 리포트</h1>
            <p className="text-sm text-muted-foreground">피부 상태 분석 결과</p>
          </div>
        </header>

        {/* 월 선택 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">
            {currentYear}년 {currentMonth}월
          </h2>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">불러오는 중...</p>
            </CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">이 달에 기록이 없어요</p>
              <p className="text-sm text-muted-foreground mb-4">
                피부 다이어리에서 기록을 시작해보세요!
              </p>
              <Button onClick={() => router.push('/analysis/skin/diary')}>기록하러 가기</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'overview' | 'trends' | 'correlations')}
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="trends">트렌드</TabsTrigger>
                <TabsTrigger value="correlations">상관관계</TabsTrigger>
              </TabsList>

              {/* 개요 탭 */}
              <TabsContent value="overview" className="space-y-4">
                {/* 요약 카드 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">이달의 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 평균 컨디션 & 트렌드 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">평균 컨디션</p>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-3xl"
                            style={{
                              textShadow: `0 0 8px ${CONDITION_COLORS[Math.round(monthlyReport?.avgCondition || 3) as 1 | 2 | 3 | 4 | 5]}`,
                            }}
                          >
                            {
                              CONDITION_EMOJIS[
                                Math.round(monthlyReport?.avgCondition || 3) as 1 | 2 | 3 | 4 | 5
                              ]
                            }
                          </span>
                          <span className="text-2xl font-bold">
                            {monthlyReport?.avgCondition.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">/5</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">트렌드</p>
                        <div className={`flex items-center gap-1 ${trendColor}`}>
                          <TrendIcon className="h-5 w-5" />
                          <span className="font-medium">{trendLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* 기록 통계 */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{monthlyReport?.totalEntries}</p>
                        <p className="text-xs text-muted-foreground">기록 일수</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {monthlyReport?.bestDay?.getDate() || '-'}일
                        </p>
                        <p className="text-xs text-muted-foreground">최고의 날</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {monthlyReport?.worstDay?.getDate() || '-'}일
                        </p>
                        <p className="text-xs text-muted-foreground">주의 필요일</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 루틴 완료율 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">루틴 완료율</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span>아침 루틴</span>
                          </div>
                          <span className="font-medium">
                            {monthlyReport?.routineCompletionRate.morning}%
                          </span>
                        </div>
                        <Progress
                          value={monthlyReport?.routineCompletionRate.morning}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-indigo-500" />
                            <span>저녁 루틴</span>
                          </div>
                          <span className="font-medium">
                            {monthlyReport?.routineCompletionRate.evening}%
                          </span>
                        </div>
                        <Progress
                          value={monthlyReport?.routineCompletionRate.evening}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 주요 인사이트 */}
                {monthlyReport && monthlyReport.topFactors.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-violet-500" />
                        <CardTitle className="text-lg">주요 인사이트</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {monthlyReport.topFactors.map((factor, index) => (
                        <div
                          key={factor.factorKey}
                          className={`p-3 rounded-lg ${
                            factor.isPositive
                              ? 'bg-green-50 dark:bg-green-950/30'
                              : 'bg-amber-50 dark:bg-amber-950/30'
                          }`}
                        >
                          <p className="font-medium text-sm">{factor.factor}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{factor.insight}</p>
                          <p className="text-xs mt-1 font-medium">{factor.recommendation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 트렌드 탭 */}
              <TabsContent value="trends" className="space-y-4">
                <FactorTrendChart entries={entries} factor="skinCondition" period="30days" />

                {/* 주간 평균 */}
                {weeklyAverages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">주간 평균</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weeklyAverages.map((week) => (
                          <div
                            key={week.weekStart.toISOString()}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {week.weekStart.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                주
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {
                                  CONDITION_EMOJIS[
                                    Math.round(week.avgCondition) as 1 | 2 | 3 | 4 | 5
                                  ]
                                }
                              </span>
                              <span className="font-bold">{week.avgCondition.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({week.entriesCount}일)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 상관관계 탭 */}
              <TabsContent value="correlations" className="space-y-4">
                <CorrelationChart insights={correlationInsights} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}
