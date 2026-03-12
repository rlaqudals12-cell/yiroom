'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiaryEntry, TrendAnalysis, ScoreBreakdown } from '@/lib/skin-diary';

interface TrendChartProps {
  trend: TrendAnalysis;
}

const CATEGORY_LABELS: Record<keyof ScoreBreakdown, string> = {
  hydration: '수분',
  elasticity: '탄력',
  clarity: '투명도',
  tone: '톤',
};

const TREND_LABEL = {
  improving: '개선',
  stable: '안정',
  declining: '하락',
} as const;

const TREND_COLOR = {
  improving: 'text-emerald-600',
  stable: 'text-blue-600',
  declining: 'text-red-600',
} as const;

/**
 * 간단한 라인 차트 (SVG 기반, 외부 의존성 없음)
 * 데이터 포인트가 적은 초기 단계에 적합
 */
export function TrendChart({ trend }: TrendChartProps) {
  const { entries } = trend;

  if (entries.length === 0) {
    return (
      <Card data-testid="trend-chart">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>아직 분석 기록이 없어요</p>
          <p className="text-sm mt-1">피부 분석을 시작하면 자동으로 트렌드가 기록돼요</p>
        </CardContent>
      </Card>
    );
  }

  // 최신순 → 시간순으로 뒤집기
  const chronological = [...entries].reverse();

  return (
    <Card data-testid="trend-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">바이탈리티 트렌드</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* SVG 미니 차트 */}
        <MiniLineChart entries={chronological} />

        {/* 카테고리별 트렌드 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {(Object.keys(CATEGORY_LABELS) as (keyof ScoreBreakdown)[]).map((key) => {
            const catTrend = trend.categoryTrends[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50"
              >
                <span className="text-xs">{CATEGORY_LABELS[key]}</span>
                <span className={`text-xs font-medium ${TREND_COLOR[catTrend.trend]}`}>
                  {TREND_LABEL[catTrend.trend]}
                  {catTrend.changePercent !== 0 && (
                    <span className="ml-1">
                      ({catTrend.changePercent > 0 ? '+' : ''}
                      {catTrend.changePercent}%)
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// SVG 미니 라인 차트
// ============================================

function MiniLineChart({ entries }: { entries: DiaryEntry[] }) {
  if (entries.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
        2회 이상 분석하면 트렌드 차트가 표시돼요
      </div>
    );
  }

  const width = 320;
  const height = 96;
  const padding = { top: 8, right: 8, bottom: 16, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = entries.map((e) => e.vitalityScore);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const range = maxScore - minScore || 1;

  // 데이터 포인트 좌표
  const points = entries.map((e, i) => ({
    x: padding.left + (i / (entries.length - 1)) * chartW,
    y: padding.top + chartH - ((e.vitalityScore - minScore) / range) * chartH,
    score: e.vitalityScore,
    date: e.date,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      {/* Y축 눈금 */}
      {[minScore, Math.round((minScore + maxScore) / 2), maxScore].map((v) => {
        const y = padding.top + chartH - ((v - minScore) / range) * chartH;
        return (
          <g key={v}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={padding.left - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={8}
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* 라인 */}
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-primary"
        strokeLinejoin="round"
      />

      {/* 데이터 포인트 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-primary" />
      ))}

      {/* X축 라벨 (처음, 끝) */}
      {[points[0], points[points.length - 1]].map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={height - 2}
          textAnchor={i === 0 ? 'start' : 'end'}
          className="fill-muted-foreground"
          fontSize={8}
        >
          {p.date.slice(5)} {/* MM-DD */}
        </text>
      ))}
    </svg>
  );
}
