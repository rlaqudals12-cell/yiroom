'use client';

import { memo, useMemo } from 'react';
import { LineChart, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FactorTrendChartProps } from '@/types/skin-diary';
import { CONDITION_COLORS, CONDITION_EMOJIS } from '@/types/skin-diary';

/**
 * 요인별 트렌드 차트 컴포넌트
 * - 시간에 따른 피부 컨디션 변화
 * - 선 그래프 형태
 */
const FactorTrendChart = memo(function FactorTrendChart({
  entries,
  factor: _factor, // 현재 skinCondition만 지원, 향후 확장용
  period,
  className,
}: FactorTrendChartProps) {
  // 기간에 따라 필터링
  const filteredEntries = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return entries
      .filter((e) => e.entryDate >= startDate)
      .sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
  }, [entries, period]);

  // 기간 라벨
  const periodLabel = {
    '7days': '최근 7일',
    '30days': '최근 30일',
    '90days': '최근 90일',
  }[period];

  if (filteredEntries.length === 0) {
    return (
      <Card className={className} data-testid="factor-trend-chart">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{periodLabel} 동안 기록이 없어요</p>
        </CardContent>
      </Card>
    );
  }

  // Y축 범위: 1-5 (피부 컨디션 점수)
  const yMin = 1;
  const yMax = 5;

  // 차트 높이
  const chartHeight = 160;

  // 데이터 포인트 계산
  const dataPoints = filteredEntries.map((entry, index) => {
    const x = (index / (filteredEntries.length - 1 || 1)) * 100;
    const y = ((entry.skinCondition - yMin) / (yMax - yMin)) * 100;
    return { entry, x, y: 100 - y }; // y는 반전 (상단이 높은 값)
  });

  // SVG 경로 생성
  const linePath = dataPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  // 평균 계산
  const avgCondition =
    filteredEntries.reduce((sum, e) => sum + e.skinCondition, 0) / filteredEntries.length;

  return (
    <Card className={className} data-testid="factor-trend-chart">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-500" aria-hidden="true" />
            <CardTitle className="text-lg">피부 컨디션 트렌드</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{periodLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 요약 정보 */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">평균 컨디션</p>
            <p className="text-xl font-bold">{avgCondition.toFixed(1)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">기록 일수</p>
            <p className="text-xl font-bold">{filteredEntries.length}일</p>
          </div>
        </div>

        {/* 라인 차트 */}
        <div className="relative" style={{ height: chartHeight }}>
          {/* Y축 라벨 */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-muted-foreground">
            {[5, 4, 3, 2, 1].map((score) => (
              <span key={score}>{CONDITION_EMOJIS[score as 1 | 2 | 3 | 4 | 5]}</span>
            ))}
          </div>

          {/* 차트 영역 */}
          <div className="absolute left-10 right-0 top-0 bottom-0">
            {/* 수평 그리드 라인 */}
            <svg className="absolute inset-0 w-full h-full">
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0%"
                  y1={`${y}%`}
                  x2="100%"
                  y2={`${y}%`}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="4 4"
                />
              ))}

              {/* 데이터 라인 */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-500"
              />

              {/* 그라데이션 정의 */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={CONDITION_COLORS[3]} />
                  <stop offset="50%" stopColor={CONDITION_COLORS[4]} />
                  <stop offset="100%" stopColor={CONDITION_COLORS[5]} />
                </linearGradient>
              </defs>

              {/* 데이터 포인트 */}
              {dataPoints.map((point, i) => (
                <circle
                  key={i}
                  cx={`${point.x}%`}
                  cy={`${point.y}%`}
                  r={4}
                  fill={CONDITION_COLORS[point.entry.skinCondition as 1 | 2 | 3 | 4 | 5]}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all duration-200 hover:r-6"
                >
                  <title>
                    {point.entry.entryDate.toLocaleDateString('ko-KR')}: {point.entry.skinCondition}
                    점
                  </title>
                </circle>
              ))}
            </svg>
          </div>
        </div>

        {/* X축 라벨 */}
        <div className="flex justify-between pl-10 text-xs text-muted-foreground">
          <span>
            {filteredEntries[0]?.entryDate.toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>
            {filteredEntries[filteredEntries.length - 1]?.entryDate.toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-3 pt-2 text-xs">
          {([1, 2, 3, 4, 5] as const).map((score) => (
            <div key={score} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CONDITION_COLORS[score] }}
              />
              <span className="text-muted-foreground">{score}점</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default FactorTrendChart;
