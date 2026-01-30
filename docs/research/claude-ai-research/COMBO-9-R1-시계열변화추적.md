# COMBO-9: 시계열 변화 추적 (Time Series Change Tracking)

> 크로스도메인 분석 9/10 - 건강 데이터의 시간에 따른 변화 추적 및 시각화

---

## 1. 연구 개요

### 1.1 목적

사용자의 피부, 영양, 운동, 체형 등 다양한 건강 지표를 시간 축으로 추적하여:
- **변화 패턴** 인식
- **진행 상황** 모니터링
- **예측 분석** 제공
- **동기 부여** 강화

### 1.2 핵심 질문

| 질문 | 답변 방향 |
|------|----------|
| 어떤 데이터를 추적? | 피부점수, 영양균형, 운동빈도, 체형변화 |
| 추적 주기는? | 일간, 주간, 월간, 분기별 |
| 시각화 방법은? | 라인 차트, 영역 차트, 레이더 차트 |
| 인사이트 도출은? | 트렌드 분석, 상관관계, 예측 |

---

## 2. 시계열 데이터 구조

### 2.1 추적 가능한 지표

```typescript
// types/time-series.ts

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface ModuleTimeSeries {
  moduleId: string;
  moduleName: string;
  metrics: MetricTimeSeries[];
}

export interface MetricTimeSeries {
  metricId: string;
  metricName: string;
  unit: string;
  dataPoints: TimeSeriesDataPoint[];
  aggregation: 'average' | 'sum' | 'last' | 'max' | 'min';
}

// 추적 대상 지표 정의
export const TRACKABLE_METRICS: Record<string, TrackableMetric[]> = {
  skin: [
    { id: 'hydration', name: '수분도', unit: '%', range: [0, 100] },
    { id: 'oiliness', name: '유분도', unit: '%', range: [0, 100] },
    { id: 'sensitivity', name: '민감도', unit: '%', range: [0, 100] },
    { id: 'overall_score', name: '피부 종합 점수', unit: 'pt', range: [0, 100] },
    { id: 'pore_visibility', name: '모공 가시성', unit: '%', range: [0, 100] },
    { id: 'wrinkle_depth', name: '주름 깊이', unit: 'level', range: [1, 5] },
  ],
  nutrition: [
    { id: 'calorie_intake', name: '칼로리 섭취', unit: 'kcal', range: [0, 5000] },
    { id: 'protein_ratio', name: '단백질 비율', unit: '%', range: [0, 100] },
    { id: 'water_intake', name: '수분 섭취', unit: 'ml', range: [0, 5000] },
    { id: 'nutrition_score', name: '영양 균형 점수', unit: 'pt', range: [0, 100] },
    { id: 'fiber_intake', name: '식이섬유', unit: 'g', range: [0, 100] },
  ],
  fitness: [
    { id: 'workout_frequency', name: '운동 빈도', unit: '회/주', range: [0, 14] },
    { id: 'workout_duration', name: '운동 시간', unit: '분', range: [0, 300] },
    { id: 'calories_burned', name: '소모 칼로리', unit: 'kcal', range: [0, 2000] },
    { id: 'steps', name: '걸음 수', unit: '보', range: [0, 50000] },
    { id: 'active_minutes', name: '활동 시간', unit: '분', range: [0, 500] },
  ],
  body: [
    { id: 'weight', name: '체중', unit: 'kg', range: [30, 200] },
    { id: 'body_fat', name: '체지방률', unit: '%', range: [5, 50] },
    { id: 'muscle_mass', name: '근육량', unit: 'kg', range: [10, 100] },
    { id: 'bmi', name: 'BMI', unit: '', range: [10, 50] },
    { id: 'waist_circumference', name: '허리둘레', unit: 'cm', range: [50, 150] },
  ],
  wellness: [
    { id: 'sleep_quality', name: '수면 품질', unit: 'pt', range: [0, 100] },
    { id: 'sleep_duration', name: '수면 시간', unit: '시간', range: [0, 14] },
    { id: 'stress_level', name: '스트레스 수준', unit: 'pt', range: [0, 100] },
    { id: 'mood_score', name: '기분 점수', unit: 'pt', range: [0, 100] },
    { id: 'energy_level', name: '에너지 수준', unit: 'pt', range: [0, 100] },
  ],
};
```

### 2.2 데이터베이스 스키마

```sql
-- 시계열 데이터 저장 테이블
CREATE TABLE metric_time_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  metric_id TEXT NOT NULL,
  value DECIMAL NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  source TEXT DEFAULT 'manual', -- 'manual', 'auto', 'import'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_mts_user_module ON metric_time_series(clerk_user_id, module_id);
CREATE INDEX idx_mts_user_metric_time ON metric_time_series(clerk_user_id, metric_id, recorded_at DESC);
CREATE INDEX idx_mts_recorded_at ON metric_time_series(recorded_at);

-- RLS
ALTER TABLE metric_time_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_metrics" ON metric_time_series
  FOR ALL USING (clerk_user_id = auth.get_user_id());

-- 집계 뷰 (일별)
CREATE MATERIALIZED VIEW daily_metric_aggregates AS
SELECT
  clerk_user_id,
  module_id,
  metric_id,
  DATE(recorded_at) as date,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as count
FROM metric_time_series
GROUP BY clerk_user_id, module_id, metric_id, DATE(recorded_at);

-- 주별 집계 뷰
CREATE MATERIALIZED VIEW weekly_metric_aggregates AS
SELECT
  clerk_user_id,
  module_id,
  metric_id,
  DATE_TRUNC('week', recorded_at) as week_start,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as count
FROM metric_time_series
GROUP BY clerk_user_id, module_id, metric_id, DATE_TRUNC('week', recorded_at);
```

---

## 3. 시계열 분석 엔진

### 3.1 데이터 조회 및 집계

```typescript
// lib/time-series/queries.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface TimeSeriesQuery {
  userId: string;
  moduleId?: string;
  metricId: string;
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface AggregatedDataPoint {
  timestamp: Date;
  value: number;
  min: number;
  max: number;
  count: number;
}

export async function getTimeSeriesData(
  supabase: SupabaseClient,
  query: TimeSeriesQuery
): Promise<AggregatedDataPoint[]> {
  const { userId, moduleId, metricId, startDate, endDate, granularity } = query;

  // 시간 단위에 따른 테이블/뷰 선택
  let tableName: string;
  let dateColumn: string;

  switch (granularity) {
    case 'hour':
      tableName = 'metric_time_series';
      dateColumn = 'recorded_at';
      break;
    case 'day':
      tableName = 'daily_metric_aggregates';
      dateColumn = 'date';
      break;
    case 'week':
      tableName = 'weekly_metric_aggregates';
      dateColumn = 'week_start';
      break;
    case 'month':
      // 월별은 동적 집계
      return getMonthlyAggregates(supabase, query);
    default:
      tableName = 'daily_metric_aggregates';
      dateColumn = 'date';
  }

  let queryBuilder = supabase
    .from(tableName)
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('metric_id', metricId)
    .gte(dateColumn, startDate.toISOString())
    .lte(dateColumn, endDate.toISOString())
    .order(dateColumn, { ascending: true });

  if (moduleId) {
    queryBuilder = queryBuilder.eq('module_id', moduleId);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('[TimeSeries] Query error:', error);
    throw new Error('시계열 데이터 조회 실패');
  }

  // 원시 데이터인 경우 집계
  if (granularity === 'hour') {
    return aggregateHourly(data);
  }

  return data.map((row: any) => ({
    timestamp: new Date(row[dateColumn]),
    value: row.avg_value ?? row.value,
    min: row.min_value ?? row.value,
    max: row.max_value ?? row.value,
    count: row.count ?? 1,
  }));
}

// 누락된 날짜 채우기 (연속 시계열)
export function fillMissingDates(
  data: AggregatedDataPoint[],
  startDate: Date,
  endDate: Date,
  granularity: 'day' | 'week' | 'month'
): AggregatedDataPoint[] {
  const filled: AggregatedDataPoint[] = [];
  const dataMap = new Map(
    data.map(d => [d.timestamp.toISOString().split('T')[0], d])
  );

  let current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0];
    const existing = dataMap.get(key);

    if (existing) {
      filled.push(existing);
    } else {
      // 누락된 날짜는 null 값으로 채움 (차트에서 빈 구간 표시)
      filled.push({
        timestamp: new Date(current),
        value: NaN, // 차트 라이브러리가 null로 처리
        min: NaN,
        max: NaN,
        count: 0,
      });
    }

    // 다음 날짜로 이동
    switch (granularity) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return filled;
}
```

### 3.2 트렌드 분석

```typescript
// lib/time-series/trend-analysis.ts

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  changeAbsolute: number;
  slope: number;
  r2: number; // 결정계수 (적합도)
  significance: 'high' | 'medium' | 'low';
  periodComparison: PeriodComparison;
}

export interface PeriodComparison {
  currentPeriodAvg: number;
  previousPeriodAvg: number;
  percentChange: number;
}

export function analyzeTrend(
  data: AggregatedDataPoint[],
  metricConfig: TrackableMetric
): TrendAnalysis {
  // 유효한 데이터만 필터링
  const validData = data.filter(d => !isNaN(d.value));

  if (validData.length < 3) {
    return {
      direction: 'stable',
      changePercent: 0,
      changeAbsolute: 0,
      slope: 0,
      r2: 0,
      significance: 'low',
      periodComparison: {
        currentPeriodAvg: validData[validData.length - 1]?.value ?? 0,
        previousPeriodAvg: validData[0]?.value ?? 0,
        percentChange: 0,
      },
    };
  }

  // 선형 회귀로 트렌드 계산
  const { slope, intercept, r2 } = linearRegression(validData);

  // 첫 값과 마지막 값 비교
  const firstValue = validData[0].value;
  const lastValue = validData[validData.length - 1].value;
  const changeAbsolute = lastValue - firstValue;
  const changePercent = firstValue !== 0
    ? ((lastValue - firstValue) / firstValue) * 100
    : 0;

  // 트렌드 방향 결정 (지표 특성 고려)
  const isHigherBetter = !['oiliness', 'sensitivity', 'stress_level', 'pore_visibility', 'wrinkle_depth', 'body_fat'].includes(metricConfig.id);

  let direction: 'improving' | 'declining' | 'stable';
  const threshold = 0.05; // 5% 변화 이하는 stable

  if (Math.abs(changePercent) < threshold * 100) {
    direction = 'stable';
  } else if (isHigherBetter) {
    direction = changePercent > 0 ? 'improving' : 'declining';
  } else {
    direction = changePercent < 0 ? 'improving' : 'declining';
  }

  // 기간 비교 (현재 절반 vs 이전 절반)
  const midpoint = Math.floor(validData.length / 2);
  const previousHalf = validData.slice(0, midpoint);
  const currentHalf = validData.slice(midpoint);

  const previousAvg = average(previousHalf.map(d => d.value));
  const currentAvg = average(currentHalf.map(d => d.value));

  return {
    direction,
    changePercent,
    changeAbsolute,
    slope,
    r2,
    significance: r2 > 0.7 ? 'high' : r2 > 0.4 ? 'medium' : 'low',
    periodComparison: {
      currentPeriodAvg: currentAvg,
      previousPeriodAvg: previousAvg,
      percentChange: previousAvg !== 0
        ? ((currentAvg - previousAvg) / previousAvg) * 100
        : 0,
    },
  };
}

// 선형 회귀
function linearRegression(data: AggregatedDataPoint[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = data.length;
  const xs = data.map((_, i) => i);
  const ys = data.map(d => d.value);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = ys.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² 계산
  const yMean = sumY / n;
  const ssTotal = ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = ys.reduce((sum, y, i) => {
    const predicted = slope * xs[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const r2 = ssTotal !== 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, r2 };
}

function average(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
```

### 3.3 이상 감지

```typescript
// lib/time-series/anomaly-detection.ts

export interface Anomaly {
  timestamp: Date;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop' | 'outlier';
}

export function detectAnomalies(
  data: AggregatedDataPoint[],
  sensitivity: number = 2 // 표준편차 배수
): Anomaly[] {
  const validData = data.filter(d => !isNaN(d.value));
  if (validData.length < 5) return [];

  const values = validData.map(d => d.value);
  const mean = average(values);
  const stdDev = standardDeviation(values);

  const anomalies: Anomaly[] = [];

  validData.forEach((point, index) => {
    const lowerBound = mean - sensitivity * stdDev;
    const upperBound = mean + sensitivity * stdDev;

    if (point.value < lowerBound || point.value > upperBound) {
      const deviation = Math.abs(point.value - mean) / stdDev;

      anomalies.push({
        timestamp: point.timestamp,
        value: point.value,
        expectedRange: { min: lowerBound, max: upperBound },
        severity: deviation > 3 ? 'high' : deviation > 2.5 ? 'medium' : 'low',
        type: point.value > upperBound ? 'spike' : 'drop',
      });
    }

    // 급격한 변화 감지 (전날 대비)
    if (index > 0) {
      const prevValue = validData[index - 1].value;
      const changePercent = Math.abs((point.value - prevValue) / prevValue) * 100;

      if (changePercent > 30 && prevValue !== 0) {
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedRange: {
            min: prevValue * 0.7,
            max: prevValue * 1.3
          },
          severity: changePercent > 50 ? 'high' : 'medium',
          type: point.value > prevValue ? 'spike' : 'drop',
        });
      }
    }
  });

  // 중복 제거
  return deduplicateAnomalies(anomalies);
}

function standardDeviation(arr: number[]): number {
  const mean = average(arr);
  const squaredDiffs = arr.map(value => Math.pow(value - mean, 2));
  return Math.sqrt(average(squaredDiffs));
}

function deduplicateAnomalies(anomalies: Anomaly[]): Anomaly[] {
  const seen = new Set<string>();
  return anomalies.filter(a => {
    const key = `${a.timestamp.toISOString()}-${a.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

### 3.4 상관관계 분석

```typescript
// lib/time-series/correlation.ts

export interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number; // -1 ~ 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  lag: number; // 시차 (일)
  insight: string;
}

export async function analyzeCorrelations(
  supabase: SupabaseClient,
  userId: string,
  metrics: string[],
  period: { start: Date; end: Date }
): Promise<CorrelationResult[]> {
  // 모든 지표 데이터 조회
  const metricData = await Promise.all(
    metrics.map(metricId =>
      getTimeSeriesData(supabase, {
        userId,
        metricId,
        startDate: period.start,
        endDate: period.end,
        granularity: 'day',
      })
    )
  );

  const results: CorrelationResult[] = [];

  // 모든 쌍에 대해 상관계수 계산
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const data1 = metricData[i].filter(d => !isNaN(d.value));
      const data2 = metricData[j].filter(d => !isNaN(d.value));

      // 동일 날짜 데이터만 매칭
      const aligned = alignDataByDate(data1, data2);

      if (aligned.length < 7) continue; // 최소 7일 데이터 필요

      // 시차 0~7일에 대해 상관계수 계산
      let bestCorrelation = 0;
      let bestLag = 0;

      for (let lag = 0; lag <= 7; lag++) {
        const corr = calculatePearsonCorrelation(
          aligned.map(d => d.value1),
          aligned.slice(lag).map(d => d.value2)
        );

        if (Math.abs(corr) > Math.abs(bestCorrelation)) {
          bestCorrelation = corr;
          bestLag = lag;
        }
      }

      const absCorr = Math.abs(bestCorrelation);

      results.push({
        metric1: metrics[i],
        metric2: metrics[j],
        correlation: bestCorrelation,
        strength:
          absCorr > 0.7 ? 'strong' :
          absCorr > 0.4 ? 'moderate' :
          absCorr > 0.2 ? 'weak' : 'none',
        direction:
          bestCorrelation > 0.1 ? 'positive' :
          bestCorrelation < -0.1 ? 'negative' : 'none',
        lag: bestLag,
        insight: generateCorrelationInsight(
          metrics[i],
          metrics[j],
          bestCorrelation,
          bestLag
        ),
      });
    }
  }

  // 상관관계 강도순 정렬
  return results.sort((a, b) =>
    Math.abs(b.correlation) - Math.abs(a.correlation)
  );
}

// Pearson 상관계수
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const meanX = average(x.slice(0, n));
  const meanY = average(y.slice(0, n));

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denominator = Math.sqrt(sumX2 * sumY2);
  return denominator !== 0 ? sumXY / denominator : 0;
}

function generateCorrelationInsight(
  metric1: string,
  metric2: string,
  correlation: number,
  lag: number
): string {
  const metricNames: Record<string, string> = {
    hydration: '피부 수분도',
    water_intake: '수분 섭취량',
    sleep_quality: '수면 품질',
    stress_level: '스트레스',
    workout_frequency: '운동 빈도',
    nutrition_score: '영양 점수',
    // ...
  };

  const name1 = metricNames[metric1] || metric1;
  const name2 = metricNames[metric2] || metric2;
  const absCorr = Math.abs(correlation);

  if (absCorr < 0.2) {
    return `${name1}와(과) ${name2} 사이에 유의미한 상관관계가 없습니다.`;
  }

  const strength = absCorr > 0.7 ? '강한' : absCorr > 0.4 ? '뚜렷한' : '약한';
  const direction = correlation > 0 ? '양의' : '음의';
  const lagText = lag > 0 ? ` (${lag}일 후 영향)` : '';

  if (correlation > 0) {
    return `${name1}이(가) 높을수록 ${name2}도 높아지는 ${strength} ${direction} 상관관계가 있습니다${lagText}.`;
  } else {
    return `${name1}이(가) 높을수록 ${name2}는 낮아지는 ${strength} ${direction} 상관관계가 있습니다${lagText}.`;
  }
}
```

---

## 4. 시각화 컴포넌트

### 4.1 라인 차트 (주요 추세)

```tsx
// components/time-series/TrendLineChart.tsx
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { AggregatedDataPoint, TrendAnalysis } from '@/lib/time-series/types';

interface TrendLineChartProps {
  data: AggregatedDataPoint[];
  metricName: string;
  unit: string;
  trend?: TrendAnalysis;
  showGoal?: number;
  showMinMax?: boolean;
}

export function TrendLineChart({
  data,
  metricName,
  unit,
  trend,
  showGoal,
  showMinMax = false,
}: TrendLineChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: formatDate(point.timestamp),
      value: isNaN(point.value) ? null : point.value,
      min: isNaN(point.min) ? null : point.min,
      max: isNaN(point.max) ? null : point.max,
    }));
  }, [data]);

  const trendColor = trend?.direction === 'improving'
    ? '#22c55e'
    : trend?.direction === 'declining'
    ? '#ef4444'
    : '#6b7280';

  return (
    <div className="w-full" data-testid="trend-line-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{metricName}</h3>
        {trend && (
          <TrendBadge
            direction={trend.direction}
            changePercent={trend.changePercent}
          />
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.1} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}${unit}`}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border">
                  <p className="font-medium">{label}</p>
                  <p className="text-lg font-bold" style={{ color: trendColor }}>
                    {payload[0].value}{unit}
                  </p>
                </div>
              );
            }}
          />

          {showMinMax && (
            <Area
              type="monotone"
              dataKey="max"
              stroke="none"
              fill="#f3f4f6"
              fillOpacity={0.5}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            fillOpacity={1}
            fill="url(#colorValue)"
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            dot={{ r: 3, fill: trendColor }}
            activeDot={{ r: 5, fill: trendColor }}
            connectNulls={false}
          />

          {showGoal && (
            <ReferenceLine
              y={showGoal}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: '목표', position: 'right', fill: '#f59e0b' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {trend && (
        <TrendSummary trend={trend} metricName={metricName} />
      )}
    </div>
  );
}

function TrendBadge({
  direction,
  changePercent
}: {
  direction: string;
  changePercent: number;
}) {
  const config = {
    improving: { bg: 'bg-green-100', text: 'text-green-700', icon: '↑' },
    declining: { bg: 'bg-red-100', text: 'text-red-700', icon: '↓' },
    stable: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '→' },
  }[direction] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '→' };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.icon} {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

function TrendSummary({
  trend,
  metricName
}: {
  trend: TrendAnalysis;
  metricName: string;
}) {
  const directionText = {
    improving: '개선되고',
    declining: '하락하고',
    stable: '유지되고',
  }[trend.direction];

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
      <p>
        지난 기간 동안 <strong>{metricName}</strong>이(가){' '}
        <strong className={trend.direction === 'improving' ? 'text-green-600' : trend.direction === 'declining' ? 'text-red-600' : ''}>
          {directionText}
        </strong>{' '}
        있습니다.
        {trend.significance === 'high' && ' (통계적으로 유의미한 변화)'}
      </p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
```

### 4.2 다중 지표 비교 차트

```tsx
// components/time-series/MultiMetricChart.tsx
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricSeries {
  id: string;
  name: string;
  data: { timestamp: Date; value: number }[];
  color: string;
}

interface MultiMetricChartProps {
  series: MetricSeries[];
  normalizeScale?: boolean;
}

export function MultiMetricChart({
  series,
  normalizeScale = true
}: MultiMetricChartProps) {
  const chartData = useMemo(() => {
    // 모든 날짜 수집
    const allDates = new Set<string>();
    series.forEach(s => {
      s.data.forEach(d => {
        allDates.add(d.timestamp.toISOString().split('T')[0]);
      });
    });

    // 날짜별로 데이터 병합
    const dateArray = Array.from(allDates).sort();

    return dateArray.map(date => {
      const point: Record<string, any> = { date: formatDate(new Date(date)) };

      series.forEach(s => {
        const dataPoint = s.data.find(
          d => d.timestamp.toISOString().split('T')[0] === date
        );

        if (normalizeScale && dataPoint) {
          // 0-100 스케일로 정규화
          const values = s.data.map(d => d.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          point[s.id] = max !== min
            ? ((dataPoint.value - min) / (max - min)) * 100
            : 50;
        } else {
          point[s.id] = dataPoint?.value ?? null;
        }
      });

      return point;
    });
  }, [series, normalizeScale]);

  return (
    <div className="w-full" data-testid="multi-metric-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={normalizeScale ? [0, 100] : ['auto', 'auto']}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border">
                  <p className="font-medium mb-2">{label}</p>
                  {payload.map((p: any) => (
                    <div key={p.dataKey} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}: </span>
                      <span className="font-medium">
                        {typeof p.value === 'number' ? p.value.toFixed(1) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />

          <Legend />

          {series.map(s => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 4.3 진행률 위젯

```tsx
// components/time-series/ProgressWidget.tsx
'use client';

import { useMemo } from 'react';
import { TrendAnalysis } from '@/lib/time-series/types';

interface ProgressWidgetProps {
  metricName: string;
  currentValue: number;
  goalValue: number;
  unit: string;
  trend?: TrendAnalysis;
  timeframe: string;
}

export function ProgressWidget({
  metricName,
  currentValue,
  goalValue,
  unit,
  trend,
  timeframe,
}: ProgressWidgetProps) {
  const progress = useMemo(() => {
    return Math.min(100, Math.max(0, (currentValue / goalValue) * 100));
  }, [currentValue, goalValue]);

  const remaining = goalValue - currentValue;
  const isComplete = progress >= 100;

  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border"
      data-testid="progress-widget"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{metricName}</h4>
        <span className="text-sm text-gray-500">{timeframe}</span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold">
          {currentValue.toLocaleString()}
        </span>
        <span className="text-gray-500 mb-1">
          / {goalValue.toLocaleString()} {unit}
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute h-full rounded-full transition-all duration-500 ${
            isComplete ? 'bg-green-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={isComplete ? 'text-green-600 font-medium' : 'text-gray-500'}>
          {isComplete ? '목표 달성!' : `${remaining.toLocaleString()}${unit} 남음`}
        </span>

        {trend && (
          <span className={`flex items-center gap-1 ${
            trend.direction === 'improving' ? 'text-green-600' :
            trend.direction === 'declining' ? 'text-red-600' :
            'text-gray-500'
          }`}>
            {trend.direction === 'improving' ? '↑' :
             trend.direction === 'declining' ? '↓' : '→'}
            {Math.abs(trend.changePercent).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
```

### 4.4 상관관계 히트맵

```tsx
// components/time-series/CorrelationHeatmap.tsx
'use client';

import { useMemo } from 'react';
import { CorrelationResult } from '@/lib/time-series/correlation';

interface CorrelationHeatmapProps {
  correlations: CorrelationResult[];
  metrics: string[];
}

export function CorrelationHeatmap({
  correlations,
  metrics
}: CorrelationHeatmapProps) {
  const matrix = useMemo(() => {
    const result: number[][] = [];

    metrics.forEach((m1, i) => {
      result[i] = [];
      metrics.forEach((m2, j) => {
        if (i === j) {
          result[i][j] = 1;
        } else {
          const corr = correlations.find(
            c => (c.metric1 === m1 && c.metric2 === m2) ||
                 (c.metric1 === m2 && c.metric2 === m1)
          );
          result[i][j] = corr?.correlation ?? 0;
        }
      });
    });

    return result;
  }, [correlations, metrics]);

  const getColor = (value: number) => {
    if (value > 0.5) return 'bg-green-500';
    if (value > 0.2) return 'bg-green-300';
    if (value > -0.2) return 'bg-gray-100';
    if (value > -0.5) return 'bg-red-300';
    return 'bg-red-500';
  };

  const metricLabels: Record<string, string> = {
    hydration: '수분',
    oiliness: '유분',
    water_intake: '수분섭취',
    sleep_quality: '수면',
    workout_frequency: '운동',
    stress_level: '스트레스',
    nutrition_score: '영양',
  };

  return (
    <div className="overflow-x-auto" data-testid="correlation-heatmap">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="w-20" />
            {metrics.map(m => (
              <th key={m} className="text-xs font-medium text-gray-500 p-2">
                {metricLabels[m] || m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m1, i) => (
            <tr key={m1}>
              <td className="text-xs font-medium text-gray-500 p-2">
                {metricLabels[m1] || m1}
              </td>
              {metrics.map((m2, j) => (
                <td key={m2} className="p-1">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium ${getColor(matrix[i][j])} ${
                      Math.abs(matrix[i][j]) > 0.3 ? 'text-white' : 'text-gray-700'
                    }`}
                    title={`${metricLabels[m1]} ↔ ${metricLabels[m2]}: ${matrix[i][j].toFixed(2)}`}
                  >
                    {matrix[i][j].toFixed(1)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded" /> 강한 양의 상관
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-100 rounded" /> 상관 없음
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded" /> 강한 음의 상관
        </span>
      </div>
    </div>
  );
}
```

---

## 5. 인사이트 생성

### 5.1 자동 인사이트 엔진

```typescript
// lib/time-series/insights.ts

export interface TimeSeriesInsight {
  id: string;
  type: 'trend' | 'correlation' | 'anomaly' | 'milestone' | 'prediction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metrics: string[];
  actionable?: string;
  timestamp: Date;
}

export async function generateTimeSeriesInsights(
  userId: string,
  supabase: SupabaseClient,
  period: { start: Date; end: Date }
): Promise<TimeSeriesInsight[]> {
  const insights: TimeSeriesInsight[] = [];

  // 1. 각 지표의 트렌드 분석
  const trendInsights = await generateTrendInsights(userId, supabase, period);
  insights.push(...trendInsights);

  // 2. 지표 간 상관관계 인사이트
  const correlationInsights = await generateCorrelationInsights(userId, supabase, period);
  insights.push(...correlationInsights);

  // 3. 이상치 인사이트
  const anomalyInsights = await generateAnomalyInsights(userId, supabase, period);
  insights.push(...anomalyInsights);

  // 4. 마일스톤 인사이트
  const milestoneInsights = await generateMilestoneInsights(userId, supabase);
  insights.push(...milestoneInsights);

  // 우선순위 정렬
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function generateTrendInsights(
  userId: string,
  supabase: SupabaseClient,
  period: { start: Date; end: Date }
): Promise<TimeSeriesInsight[]> {
  const insights: TimeSeriesInsight[] = [];

  const metricsToAnalyze = [
    'hydration', 'oiliness', 'nutrition_score',
    'workout_frequency', 'sleep_quality', 'stress_level'
  ];

  for (const metricId of metricsToAnalyze) {
    const data = await getTimeSeriesData(supabase, {
      userId,
      metricId,
      startDate: period.start,
      endDate: period.end,
      granularity: 'day',
    });

    const metricConfig = findMetricConfig(metricId);
    if (!metricConfig) continue;

    const trend = analyzeTrend(data, metricConfig);

    if (trend.significance === 'high' && trend.direction !== 'stable') {
      insights.push({
        id: `trend-${metricId}-${Date.now()}`,
        type: 'trend',
        priority: trend.direction === 'declining' ? 'high' : 'medium',
        title: generateTrendTitle(metricConfig.name, trend),
        description: generateTrendDescription(metricConfig.name, trend),
        metrics: [metricId],
        actionable: generateTrendAction(metricId, trend),
        timestamp: new Date(),
      });
    }
  }

  return insights;
}

function generateTrendTitle(metricName: string, trend: TrendAnalysis): string {
  const direction = trend.direction === 'improving' ? '개선 중' :
                   trend.direction === 'declining' ? '하락 중' : '안정적';
  return `${metricName} ${direction}`;
}

function generateTrendDescription(
  metricName: string,
  trend: TrendAnalysis
): string {
  const absChange = Math.abs(trend.changePercent).toFixed(1);
  const period = '지난 기간 동안';

  if (trend.direction === 'improving') {
    return `${period} ${metricName}이(가) ${absChange}% 개선되었습니다. 현재 관리가 효과를 보이고 있습니다.`;
  } else if (trend.direction === 'declining') {
    return `${period} ${metricName}이(가) ${absChange}% 하락했습니다. 관리 방법을 검토해 보세요.`;
  }
  return `${period} ${metricName}이(가) 안정적으로 유지되고 있습니다.`;
}

function generateTrendAction(metricId: string, trend: TrendAnalysis): string {
  if (trend.direction !== 'declining') return '';

  const actions: Record<string, string> = {
    hydration: '수분 크림 사용량을 늘리고 물 섭취를 늘려보세요.',
    oiliness: '가벼운 보습제로 변경하고 클렌징을 꼼꼼히 해보세요.',
    nutrition_score: '채소와 과일 섭취를 늘려보세요.',
    workout_frequency: '가벼운 운동부터 다시 시작해 보세요.',
    sleep_quality: '취침 1시간 전 전자기기 사용을 줄여보세요.',
    stress_level: '명상이나 가벼운 스트레칭을 시도해 보세요.',
  };

  return actions[metricId] || '전문가 상담을 고려해 보세요.';
}
```

### 5.2 예측 분석

```typescript
// lib/time-series/prediction.ts

export interface Prediction {
  metricId: string;
  currentValue: number;
  predictedValue: number;
  predictionDate: Date;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

// 간단한 지수 평활법 (Exponential Smoothing)
export function predictNextValue(
  data: AggregatedDataPoint[],
  alpha: number = 0.3 // 평활 계수
): { value: number; confidence: number } {
  const validData = data.filter(d => !isNaN(d.value));
  if (validData.length < 3) {
    return {
      value: validData[validData.length - 1]?.value ?? 0,
      confidence: 0.3
    };
  }

  // 지수 평활
  let smoothed = validData[0].value;
  for (let i = 1; i < validData.length; i++) {
    smoothed = alpha * validData[i].value + (1 - alpha) * smoothed;
  }

  // 신뢰도: 데이터 양과 변동성 기반
  const variance = calculateVariance(validData.map(d => d.value));
  const dataPoints = validData.length;
  const confidence = Math.min(0.9, 0.5 + (dataPoints / 30) * 0.3 - (variance / 1000) * 0.2);

  return { value: smoothed, confidence: Math.max(0.3, confidence) };
}

// 목표 달성 예측
export function predictGoalAchievement(
  data: AggregatedDataPoint[],
  goal: number,
  daysToGoal: number
): {
  willAchieve: boolean;
  predictedDays: number | null;
  confidence: number;
} {
  const validData = data.filter(d => !isNaN(d.value));
  if (validData.length < 7) {
    return { willAchieve: false, predictedDays: null, confidence: 0.3 };
  }

  const { slope } = linearRegression(validData);
  const currentValue = validData[validData.length - 1].value;
  const diff = goal - currentValue;

  if (slope === 0) {
    return {
      willAchieve: diff <= 0,
      predictedDays: diff <= 0 ? 0 : null,
      confidence: 0.5
    };
  }

  const daysNeeded = diff / slope;

  if (daysNeeded < 0) {
    // 이미 목표 초과 또는 방향이 반대
    return {
      willAchieve: diff <= 0,
      predictedDays: diff <= 0 ? 0 : null,
      confidence: 0.6,
    };
  }

  return {
    willAchieve: daysNeeded <= daysToGoal,
    predictedDays: Math.round(daysNeeded),
    confidence: 0.7,
  };
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}
```

---

## 6. 페이지 구현

### 6.1 진행 상황 페이지

```tsx
// app/(main)/progress/page.tsx
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ProgressOverview } from '@/components/progress/ProgressOverview';
import { TimeSeriesSection } from '@/components/progress/TimeSeriesSection';
import { CorrelationSection } from '@/components/progress/CorrelationSection';
import { InsightsSection } from '@/components/progress/InsightsSection';
import { Skeleton } from '@/components/ui/skeleton';

export default async function ProgressPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="container mx-auto px-4 py-8" data-testid="progress-page">
      <h1 className="text-2xl font-bold mb-6">내 변화 추적</h1>

      {/* 기간 선택 */}
      <PeriodSelector />

      {/* 종합 개요 */}
      <Suspense fallback={<OverviewSkeleton />}>
        <ProgressOverview userId={userId} />
      </Suspense>

      {/* 인사이트 */}
      <Suspense fallback={<Skeleton className="h-48" />}>
        <InsightsSection userId={userId} />
      </Suspense>

      {/* 모듈별 추세 */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TimeSeriesSection userId={userId} />
      </Suspense>

      {/* 상관관계 분석 */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <CorrelationSection userId={userId} />
      </Suspense>
    </div>
  );
}

function PeriodSelector() {
  return (
    <div className="flex gap-2 mb-6">
      {['7일', '30일', '90일', '1년'].map(period => (
        <button
          key={period}
          className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
        >
          {period}
        </button>
      ))}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
```

---

## 7. 구현 체크리스트

### P0 (Critical) - 핵심 기능

- [ ] 시계열 데이터 저장 스키마
- [ ] 기본 데이터 조회 API
- [ ] 라인 차트 컴포넌트
- [ ] 트렌드 분석 (상승/하락/안정)

### P1 (High) - 주요 기능

- [ ] 다중 지표 비교 차트
- [ ] 이상치 감지
- [ ] 기간별 집계 (일/주/월)
- [ ] 진행률 위젯

### P2 (Medium) - 부가 기능

- [ ] 상관관계 분석
- [ ] 히트맵 시각화
- [ ] 예측 분석
- [ ] 자동 인사이트 생성
- [ ] 목표 설정 및 추적

---

## 8. 참고 자료

### 학술 자료
- mHealth Apps and Wearables for Health Tracking
- Time Series Analysis in Healthcare Applications

### 기술 문서
- [Recharts 공식 문서](https://recharts.org/)
- [D3.js Time Series](https://d3js.org/)
- [Apple Health Trends](https://developer.apple.com/documentation/healthkit)

### 시장 동향
- Fitness Tracker Market 2025
- Health App UX Best Practices

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: Cross-Domain Analysis (9/10)
**Dependencies**: COMBO-8 (통합 대시보드)
