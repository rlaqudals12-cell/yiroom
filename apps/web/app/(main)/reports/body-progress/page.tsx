'use client';

/**
 * 체형 변화 추적 페이지
 * - 체형 타입 카드
 * - 측정치 비교 (어깨/허리/엉덩이 delta)
 * - 히스토리
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Ruler,
  ArrowUpDown,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';

interface Measurement {
  id: string;
  date: string;
  shoulder: number | null;
  waist: number | null;
  hip: number | null;
  bodyType?: string;
}

interface BodyProgressData {
  bodyType: string | null;
  bodyTypeDescription: string | null;
  measurements: Measurement[];
}

// 보라색 테마 색상
const ACCENT = '#A78BFA';

export default function BodyProgressPage(): React.ReactElement {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<BodyProgressData>({
    bodyType: null,
    bodyTypeDescription: null,
    measurements: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    if (!isLoaded || !user) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/reports/body-progress');
      if (!res.ok) throw new Error('데이터를 불러올 수 없어요');
      const result = await res.json();
      setData({
        bodyType: result.data?.bodyType ?? null,
        bodyTypeDescription: result.data?.bodyTypeDescription ?? null,
        measurements: result.data?.measurements ?? [],
      });
    } catch {
      setError('체형 데이터를 불러오는 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 측정치 delta 계산 (최신 vs 이전)
  const getDelta = (
    key: 'shoulder' | 'waist' | 'hip'
  ): { value: number; isPositive: boolean } | null => {
    if (data.measurements.length < 2) return null;
    const latest = data.measurements[0]?.[key];
    const prev = data.measurements[1]?.[key];
    if (latest === null || latest === undefined || prev === null || prev === undefined) return null;
    const diff = latest - prev;
    return { value: Math.abs(diff), isPositive: diff > 0 };
  };

  // 로딩 상태
  if (!isLoaded || isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="body-progress-page">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-40 rounded-xl mb-4" />
        <Skeleton className="h-48 rounded-xl mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // 에러 상태
  if (error && data.measurements.length === 0) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6" data-testid="body-progress-page">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  const latest = data.measurements[0];
  const shoulderDelta = getDelta('shoulder');
  const waistDelta = getDelta('waist');
  const hipDelta = getDelta('hip');

  return (
    <div className="container max-w-lg mx-auto px-4 py-6" data-testid="body-progress-page">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowUpDown className="h-6 w-6" style={{ color: ACCENT }} />
          체형 변화
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          체형 분석 결과와 변화 추이를 확인하세요
        </p>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 체형 타입 카드 */}
      <Card className="mb-4 border-2" style={{ borderColor: `${ACCENT}40` }}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}20` }}
            >
              <Ruler className="h-8 w-8" style={{ color: ACCENT }} />
            </div>
            {data.bodyType ? (
              <>
                <h2 className="text-xl font-bold mb-1" style={{ color: ACCENT }}>
                  {data.bodyType}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data.bodyTypeDescription || '체형 분석에서 확인된 타입이에요'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-medium text-muted-foreground mb-1">
                  아직 체형 분석 기록이 없어요
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  체형 분석을 진행하면 여기에 결과가 표시돼요
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = '/analysis/body')}
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  체형 분석하기
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 측정치 비교 */}
      {latest && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="h-4 w-4" style={{ color: ACCENT }} />
              최근 측정치
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MeasurementRow
                label="어깨 너비"
                value={latest.shoulder}
                delta={shoulderDelta}
                accentColor={ACCENT}
              />
              <MeasurementRow
                label="허리 둘레"
                value={latest.waist}
                delta={waistDelta}
                accentColor={ACCENT}
              />
              <MeasurementRow
                label="엉덩이 둘레"
                value={latest.hip}
                delta={hipDelta}
                accentColor={ACCENT}
              />
            </div>
            {data.measurements.length < 2 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                2회 이상 분석하면 변화량을 비교할 수 있어요
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            분석 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.measurements.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpDown className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                아직 체형 분석 기록이 없어요.
                <br />
                체형 분석을 진행해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.measurements.map((measurement, index) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {measurement.bodyType || '체형 분석'}
                      {index === 0 && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${ACCENT}20`,
                            color: ACCENT,
                          }}
                        >
                          최신
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(measurement.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {measurement.shoulder && <p>어깨 {measurement.shoulder}cm</p>}
                    {measurement.waist && <p>허리 {measurement.waist}cm</p>}
                    {measurement.hip && <p>엉덩이 {measurement.hip}cm</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 측정치 행 컴포넌트
function MeasurementRow({
  label,
  value,
  delta,
  accentColor,
}: {
  label: string;
  value: number | null;
  delta: { value: number; isPositive: boolean } | null;
  accentColor: string;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{value !== null ? `${value}cm` : '--'}</span>
        {delta && (
          <span
            className="flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            {delta.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta.value > 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {delta.value > 0 ? `${delta.isPositive ? '+' : '-'}${delta.value.toFixed(1)}` : '0'}
          </span>
        )}
      </div>
    </div>
  );
}
