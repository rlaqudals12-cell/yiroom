'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, FileText, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import {
  DiaryCalendar,
  DiaryEntryForm,
  MonthlyReportCard,
  CorrelationChart,
  FactorTrendChart,
} from '@/components/skin/diary';
import type {
  SkinDiaryEntry,
  SkinDiaryEntryInput,
  MonthlyReport,
  CorrelationInsight,
  DbSkinDiaryEntry,
  SkinConditionScore,
} from '@/types/skin-diary';
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

export default function SkinDiaryPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [activeTab, setActiveTab] = useState<'calendar' | 'insights'>('calendar');
  const [entries, setEntries] = useState<SkinDiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<SkinDiaryEntry | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

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
        console.error('[Diary] Load entries error:', err);
        setError('다이어리를 불러오지 못했어요.');
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

  // 월 변경 핸들러
  const handleMonthChange = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  }, []);

  // 날짜 선택 핸들러
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const entry = entries.find((e) => {
        const entryDate = e.entryDate.toISOString().split('T')[0];
        const selectedDateStr = date.toISOString().split('T')[0];
        return entryDate === selectedDateStr;
      });
      setSelectedEntry(entry);
      setShowForm(true);
    },
    [entries]
  );

  // 엔트리 저장 핸들러
  const handleSaveEntry = useCallback(
    async (input: SkinDiaryEntryInput) => {
      try {
        setSaving(true);
        setError(null);

        const dateStr = input.entryDate.toISOString().split('T')[0];

        const { error: err } = await supabase.from('skin_diary_entries').upsert(
          {
            entry_date: dateStr,
            skin_condition: input.skinCondition,
            condition_notes: input.conditionNotes || null,
            sleep_hours: input.sleepHours ?? null,
            sleep_quality: input.sleepQuality ?? null,
            water_intake_ml: input.waterIntakeMl ?? null,
            stress_level: input.stressLevel ?? null,
            weather: input.weather || null,
            outdoor_hours: input.outdoorHours ?? null,
            morning_routine_completed: input.morningRoutineCompleted ?? false,
            evening_routine_completed: input.eveningRoutineCompleted ?? false,
            special_treatments: input.specialTreatments || null,
          },
          {
            onConflict: 'clerk_user_id,entry_date',
          }
        );

        if (err) throw err;

        // 목록 새로고침
        await loadEntries(currentYear, currentMonth);
        setShowForm(false);
        setSelectedEntry(undefined);
      } catch (err) {
        console.error('[Diary] Save error:', err);
        setError('저장에 실패했어요. 다시 시도해주세요.');
      } finally {
        setSaving(false);
      }
    },
    [supabase, loadEntries, currentYear, currentMonth]
  );

  // 폼 취소 핸들러
  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setSelectedEntry(undefined);
  }, []);

  // 상관관계 인사이트 계산
  const correlationInsights = useMemo<CorrelationInsight[]>(() => {
    if (entries.length < 7) {
      return DEFAULT_INSIGHTS;
    }
    return analyzeCorrelations(entries, '30days');
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

    // 간단한 트렌드 계산
    let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
    if (entries.length >= 7) {
      const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
      const secondHalf = entries.slice(Math.floor(entries.length / 2));
      const firstAvg = firstHalf.reduce((s, e) => s + e.skinCondition, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, e) => s + e.skinCondition, 0) / secondHalf.length;
      if (secondAvg - firstAvg > 0.3) trendDirection = 'improving';
      else if (secondAvg - firstAvg < -0.3) trendDirection = 'declining';
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
      weeklyAverages: [],
    };
  }, [entries, correlationInsights, currentYear, currentMonth]);

  // 로딩/인증 체크
  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요해요.</p>
          <Button onClick={() => router.push('/sign-in')}>로그인</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="skin-diary-page">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <header className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">피부 다이어리</h1>
            <p className="text-sm text-muted-foreground">매일 피부 상태를 기록해보세요</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/analysis/skin/diary/report')}
          >
            <FileText className="w-4 h-4 mr-1" />
            리포트
          </Button>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 폼 모달 */}
        {showForm ? (
          <DiaryEntryForm
            date={selectedDate}
            existingEntry={selectedEntry}
            onSubmit={handleSaveEntry}
            onCancel={handleCancelForm}
            isLoading={saving}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'calendar' | 'insights')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                캘린더
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                인사이트
              </TabsTrigger>
            </TabsList>

            {/* 캘린더 탭 */}
            <TabsContent value="calendar" className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">불러오는 중...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 캘린더 */}
                  <Card>
                    <CardContent className="pt-6">
                      <DiaryCalendar
                        entries={entries}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onMonthChange={handleMonthChange}
                      />
                    </CardContent>
                  </Card>

                  {/* 월간 요약 */}
                  {monthlyReport && (
                    <MonthlyReportCard
                      report={monthlyReport}
                      onViewDetails={() => router.push('/analysis/skin/diary/report')}
                    />
                  )}
                </>
              )}
            </TabsContent>

            {/* 인사이트 탭 */}
            <TabsContent value="insights" className="space-y-4">
              {entries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-2">아직 기록이 없어요</p>
                    <p className="text-sm text-muted-foreground">
                      캘린더에서 날짜를 선택해 첫 기록을 작성해보세요!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* 트렌드 차트 */}
                  <FactorTrendChart entries={entries} factor="skinCondition" period="30days" />

                  {/* 상관관계 차트 */}
                  <CorrelationChart insights={correlationInsights} />
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
