'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getDateLocale } from '@/lib/utils/date-format';
import { ArrowLeft, Calendar, ChevronRight, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  PersonalColorHistoryItem,
  PeriodFilter,
  AnalysisHistoryResponse,
} from '@/types/analysis-history';
import { PERIOD_LABELS } from '@/types/analysis-history';

// 시즌 라벨
const SEASON_LABELS: Record<string, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

// 시즌별 대표 컬러 칩
const SEASON_COLORS: Record<string, string[]> = {
  spring: ['#FFD700', '#FF6B6B', '#98D8C8', '#F7DC6F'],
  summer: ['#B0C4DE', '#DDA0DD', '#87CEEB', '#E6E6FA'],
  autumn: ['#D2691E', '#8B4513', '#DAA520', '#CD853F'],
  winter: ['#000080', '#8B0000', '#4B0082', '#FFFFFF'],
};

export default function PersonalColorHistoryPage(): React.JSX.Element {
  const router = useRouter();
  const locale = useLocale();
  const [period, setPeriod] = useState<PeriodFilter>('3m');
  const [analyses, setAnalyses] = useState<PersonalColorHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchHistory = async (): Promise<void> => {
      setLoading(true);
      setHasError(false);
      try {
        const res = await fetch(
          `/api/analysis/history?type=personal-color&period=${period}&limit=20`
        );
        if (res.ok) {
          const data: AnalysisHistoryResponse = await res.json();
          setAnalyses(data.analyses as PersonalColorHistoryItem[]);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('[PC-1 History] Fetch error:', error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [period, retryCount]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getDateLocale(locale), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="mx-auto min-h-screen w-full max-w-7xl bg-background"
      data-testid="personal-color-history-page"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <h1 className="text-lg font-semibold">퍼스널 컬러 기록</h1>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span>색상 변화</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 기간 필터 */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="1m">{PERIOD_LABELS['1m']}</TabsTrigger>
            <TabsTrigger value="3m">{PERIOD_LABELS['3m']}</TabsTrigger>
            <TabsTrigger value="6m">{PERIOD_LABELS['6m']}</TabsTrigger>
            <TabsTrigger value="all">{PERIOD_LABELS['all']}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 로딩 상태 */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-28 bg-muted/50" />
              </Card>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {!loading && hasError && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">기록을 불러올 수 없어요</p>
              <Button variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
                다시 시도하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 빈 상태 */}
        {!loading && !hasError && analyses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">아직 퍼스널 컬러 분석 기록이 없어요</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/analysis/personal-color')}
              >
                첫 퍼스널 컬러 분석하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 분석 이력 목록 */}
        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((item) => {
              const seasonKey = item.details.season.toLowerCase();
              const seasonLabel = SEASON_LABELS[seasonKey] || item.details.season;
              const seasonColors = SEASON_COLORS[seasonKey] || SEASON_COLORS.spring;

              return (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-colors hover:border-primary/30"
                  onClick={() => router.push(`/analysis/personal-color/result/${item.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 시즌 팔레트 — 장식 대신 진단 대표색 4칩이 주인공 */}
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden grid grid-cols-2 border border-border/50 flex-shrink-0"
                        role="img"
                        aria-label={`${seasonLabel} 대표색`}
                      >
                        {seasonColors.map((color) => (
                          <div key={color} style={{ backgroundColor: color }} />
                        ))}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{formatDate(item.date)}</p>
                          <ChevronRight
                            className="h-4 w-4 text-muted-foreground flex-shrink-0"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {seasonLabel} | 신뢰도 {item.details.confidence}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 안내 메시지 */}
        {analyses.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            카드를 탭하면 상세 결과를 확인할 수 있어요
          </p>
        )}
      </div>
    </div>
  );
}
