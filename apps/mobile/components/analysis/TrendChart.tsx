/**
 * 트렌드 차트
 *
 * 분석 점수 추이를 SVG 바 차트로 시각화
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

export interface TrendDataPoint {
  date: Date;
  score: number;
  label?: string;
}

export type TrendMetric = 'overall' | 'hydration' | 'oiliness' | 'pores' | 'vitality';

export interface TrendChartProps {
  data: TrendDataPoint[];
  metric?: TrendMetric;
  /** 차트 높이 (기본 160) */
  height?: number;
  /** 목표선 표시 */
  showGoal?: boolean;
  goalScore?: number;
}

export function TrendChart({
  data,
  metric = 'overall',
  height = 160,
  showGoal = false,
  goalScore = 80,
}: TrendChartProps): React.ReactElement {
  const { colors, brand, status, module, typography } = useTheme();

  // 메트릭별 색상
  const metricColor = useMemo(() => {
    const map: Record<TrendMetric, string> = {
      overall: brand.primary,
      hydration: module.skin.base,
      oiliness: status.warning,
      pores: module.body.base,
      vitality: status.success,
    };
    return map[metric];
  }, [metric, brand.primary, module.skin.base, module.body.base, status.warning, status.success]);

  // 최근 6개 데이터
  const recentData = useMemo(() => data.slice(-6), [data]);

  // 트렌드 판단
  const trend = useMemo(() => {
    if (recentData.length < 2) return 'same';
    const diff = recentData[recentData.length - 1].score - recentData[0].score;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'same';
  }, [recentData]);

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? status.success : trend === 'down' ? colors.destructive : colors.mutedForeground;

  if (recentData.length === 0) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
        testID="trend-chart"
      >
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
          분석 기록이 없어요
        </Text>
      </View>
    );
  }

  const chartWidth = 300;
  const barWidth = Math.min(36, (chartWidth - 40) / recentData.length - 8);
  const maxScore = 100;
  const chartHeight = height - 40;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="trend-chart"
      accessibilityLabel={`트렌드 차트: ${recentData.length}개 데이터, 추세 ${trend === 'up' ? '상승' : trend === 'down' ? '하락' : '유지'}`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.base }]}>
          점수 추이
        </Text>
        <View style={styles.trendBadge}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          <Text style={[styles.trendLabel, { color: trendColor, fontSize: typography.size.xs }]}>
            {trend === 'up' ? '상승' : trend === 'down' ? '하락' : '유지'}
          </Text>
        </View>
      </View>

      {/* SVG 차트 */}
      <Svg width={chartWidth} height={height} style={styles.chart}>
        {/* 그리드 라인 */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = chartHeight - (val / maxScore) * chartHeight + 10;
          return (
            <Line
              key={val}
              x1={30}
              y1={y}
              x2={chartWidth - 10}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        {/* 목표선 */}
        {showGoal && (
          <Line
            x1={30}
            y1={chartHeight - (goalScore / maxScore) * chartHeight + 10}
            x2={chartWidth - 10}
            y2={chartHeight - (goalScore / maxScore) * chartHeight + 10}
            stroke={status.warning}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        )}

        {/* 바 */}
        {recentData.map((point, i) => {
          const barHeight = (point.score / maxScore) * chartHeight;
          const x = 40 + i * ((chartWidth - 60) / recentData.length);
          const y = chartHeight - barHeight + 10;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={metricColor}
                opacity={0.8}
              />
              {/* 점수 라벨 */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fill={colors.foreground}
                fontWeight="600"
              >
                {point.score}
              </SvgText>
              {/* 날짜 라벨 */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize={9}
                fill={colors.mutedForeground}
              >
                {`${point.date.getMonth() + 1}/${point.date.getDate()}`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* 범례 */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {recentData[0].score}점 → {recentData[recentData.length - 1].score}점
        </Text>
        {recentData.length >= 2 && (
          <Text style={[styles.legendDiff, { color: trendColor, fontSize: typography.size.xs }]}>
            ({recentData[recentData.length - 1].score - recentData[0].score > 0 ? '+' : ''}
            {recentData[recentData.length - 1].score - recentData[0].score})
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  trendLabel: {
    fontWeight: '500',
  },
  chart: {
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  legendText: {
    fontWeight: '500',
  },
  legendDiff: {
    fontWeight: '600',
  },
});
