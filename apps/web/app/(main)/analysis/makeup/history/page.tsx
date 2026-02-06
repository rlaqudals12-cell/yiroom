'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Heart,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import type {
  MakeupAnalysisHistoryItem,
  PeriodFilter,
  AnalysisHistoryResponse,
} from '@/types/analysis-history';
import { PERIOD_LABELS } from '@/types/analysis-history';

// 언더톤 라벨
const UNDERTONE_LABELS: Record<string, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

// 얼굴형 라벨
const FACE_SHAPE_LABELS: Record<string, string> = {
  oval: '타원형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

export default function MakeupHistoryPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodFilter>('3m');
  const [analyses, setAnalyses] = useState<MakeupAnalysisHistoryItem[]>([]);
  const [trend, setTrend] = useState<'improving' | 'declining' | 'stable'>('stable');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analysis/history?type=makeup&period=${period}&limit=20`);
        if (res.ok) {
          const data: AnalysisHistoryResponse = await res.json();
          setAnalyses(data.analyses as MakeupAnalysisHistoryItem[]);
          setTrend(data.trend);
        }
      } catch (error) {
        console.error('[Makeup History] Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [period]);

  const handleSelectForCompare = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length === 2) {
      router.push(`/analysis/makeup/compare?from=${selectedIds[0]}&to=${selectedIds[1]}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
  const trendColor =
    trend === 'improving'
      ? 'text-green-600'
      : trend === 'declining'
        ? 'text-red-600'
        : 'text-muted-foreground';
  const trendLabel =
    trend === 'improving' ? '개선 중' : trend === 'declining' ? '변화 감지' : '유지 중';

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="makeup-history-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
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
            <h1 className="text-lg font-semibold">메이크업 분석 기록</h1>
          </div>
          <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            <span>{trendLabel}</span>
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

        {/* 비교 버튼 */}
        {selectedIds.length === 2 && (
          <Button className="w-full" onClick={handleCompare}>
            선택한 2개 비교하기
          </Button>
        )}

        {selectedIds.length === 1 && (
          <p className="text-sm text-muted-foreground text-center">
            비교할 다른 기록을 선택해주세요
          </p>
        )}

        {/* 분석 이력 목록 */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-28 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">아직 메이크업 분석 기록이 없어요</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/analysis/makeup')}
              >
                첫 메이크업 분석하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const prevItem = analyses[index + 1];
              const scoreChange = prevItem ? item.overallScore - prevItem.overallScore : 0;
              const undertoneLabel =
                UNDERTONE_LABELS[item.details.undertone.toLowerCase()] || item.details.undertone;
              const faceShapeLabel =
                FACE_SHAPE_LABELS[item.details.faceShape.toLowerCase()] || item.details.faceShape;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'ring-2 ring-rose-500'
                  )}
                  onClick={() => handleSelectForCompare(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 썸네일 */}
                      {item.imageUrl ? (
                        <div
                          className="w-16 h-16 rounded-lg bg-cover bg-center bg-muted"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                          role="img"
                          aria-label="메이크업 분석 이미지"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                          <Heart className="h-6 w-6 text-rose-500" aria-hidden="true" />
                        </div>
                      )}

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{formatDate(item.date)}</p>
                          <div className="flex items-center gap-2">
                            {scoreChange !== 0 && (
                              <span
                                className={cn(
                                  'text-sm',
                                  scoreChange > 0 ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {scoreChange > 0 ? '+' : ''}
                                {scoreChange}점
                              </span>
                            )}
                            <ChevronRight
                              className="h-4 w-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {undertoneLabel} | {item.overallScore}점
                        </p>
                        <div className="flex gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-rose-600">
                            <Palette className="h-3 w-3" aria-hidden="true" />
                            <span>{undertoneLabel}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-pink-600">
                            <Heart className="h-3 w-3" aria-hidden="true" />
                            <span>{faceShapeLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-rose-600">✓ 비교 대상으로 선택됨</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 안내 메시지 */}
        {analyses.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            두 개의 기록을 선택하면 비교할 수 있어요
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
