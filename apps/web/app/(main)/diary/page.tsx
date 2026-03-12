'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendSummary } from './_components/TrendSummary';
import { TrendChart } from './_components/TrendChart';
import { SkinCalendar } from './_components/SkinCalendar';
import { AlertBanner } from './_components/AlertBanner';
import { DiaryEntryCard } from './_components/DiaryEntryCard';
import type { SkinDiaryResponse, TrendPeriod } from '@/lib/skin-diary';

export default function SkinDiaryPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<TrendPeriod>('30d');
  const [data, setData] = useState<SkinDiaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        period,
        year: String(calendarYear),
        month: String(calendarMonth),
      });
      const res = await fetch(`/api/skin-diary?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError('데이터를 불러오지 못했어요');
      }
    } catch (err) {
      console.error('[SkinDiary] Fetch error:', err);
      setError('네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }, [period, calendarYear, calendarMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (year: number, month: number): void => {
    setCalendarYear(year);
    setCalendarMonth(month);
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 space-y-4" data-testid="skin-diary-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">피부 일기</h1>
        </div>
        <Button size="sm" onClick={() => router.push('/analysis/skin')} className="gap-1">
          <Camera className="h-4 w-4" />
          분석하기
        </Button>
      </div>

      {/* 기간 선택 탭 */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as TrendPeriod)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="7d">1주</TabsTrigger>
          <TabsTrigger value="30d">1개월</TabsTrigger>
          <TabsTrigger value="90d">3개월</TabsTrigger>
        </TabsList>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : !data || data.trend.entryCount === 0 ? (
          <EmptyState onAnalyze={() => router.push('/analysis/skin')} />
        ) : (
          <>
            <TabsContent value={period} className="space-y-4 mt-4">
              {/* 알림 배너 */}
              <AlertBanner alerts={data.trend.alerts} />

              {/* 트렌드 요약 */}
              <TrendSummary trend={data.trend} />

              {/* 트렌드 차트 */}
              <TrendChart trend={data.trend} />

              {/* 캘린더 */}
              <SkinCalendar calendar={data.calendar} onMonthChange={handleMonthChange} />

              {/* 최근 기록 */}
              {data.recentEntries.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">최근 기록</h2>
                  {data.recentEntries.map((entry) => (
                    <DiaryEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

// ============================================
// 에러 상태
// ============================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12 space-y-4" data-testid="diary-error-state" role="alert">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive/50" />
      <div>
        <p className="font-medium">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">잠시 후 다시 시도해주세요</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

// ============================================
// 빈 상태
// ============================================

function EmptyState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="text-center py-12 space-y-4" data-testid="diary-empty-state">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
      <div>
        <p className="font-medium">아직 피부 기록이 없어요</p>
        <p className="text-sm text-muted-foreground mt-1">
          피부 분석을 하면 자동으로 기록이 쌓여요
        </p>
      </div>
      <Button onClick={onAnalyze} className="gap-1">
        <Camera className="h-4 w-4" />첫 분석 시작하기
      </Button>
    </div>
  );
}

// ============================================
// 로딩 스켈레톤
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4 mt-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
      <div className="h-40 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}
