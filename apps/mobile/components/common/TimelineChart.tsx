/**
 * 타임라인 차트 (점수 이력)
 *
 * 시간에 따른 점수 변화를 바 차트로 시각화
 * recharts 대신 RN View 기반 간결한 구현
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, spacing} from '../../lib/theme';

export interface TimelineDataPoint {
  date: string;
  score: number;
  label?: string;
}

export interface TimelineChartProps {
  data: TimelineDataPoint[];
  /** 최대 점수 (기본: 100) */
  maxScore?: number;
  /** 차트 높이 (기본: 120) */
  height?: number;
  /** 변형: skin, body, hair, default */
  variant?: 'skin' | 'body' | 'hair' | 'default';
  /** 목표선 표시 */
  targetScore?: number;
  title?: string;
}

export function TimelineChart({
  data,
  maxScore = 100,
  height = 120,
  variant = 'default',
  targetScore,
  title,
}: TimelineChartProps): React.ReactElement {
  const { colors, brand, status, module, typography } = useTheme();

  const variantColor =
    variant === 'skin'
      ? module.skin.base
      : variant === 'body'
        ? module.body.base
        : variant === 'hair'
          ? module.hair.base
          : brand.primary;

  // 트렌드 계산
  const trend =
    data.length >= 2
      ? data[data.length - 1].score - data[data.length - 2].score
      : 0;
  const trendLabel = trend > 0 ? '↑ 상승' : trend < 0 ? '↓ 하락' : '→ 유지';
  const trendColor = trend > 0 ? status.success : trend < 0 ? colors.destructive : colors.mutedForeground;

  return (
    <View testID="timeline-chart">
      {/* 타이틀 + 트렌드 */}
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.base }]}>
            {title}
          </Text>
          {data.length >= 2 && (
            <Text style={[styles.trend, { color: trendColor, fontSize: typography.size.xs }]}>
              {trendLabel}
            </Text>
          )}
        </View>
      )}

      {/* 차트 영역 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContent}
      >
        <View style={[styles.chartArea, { height }]}>
          {/* 목표선 */}
          {targetScore != null && (
            <View
              style={[
                styles.targetLine,
                {
                  bottom: (targetScore / maxScore) * height,
                  borderColor: status.warning,
                },
              ]}
              accessibilityLabel={`목표: ${targetScore}점`}
            />
          )}

          {/* 바 */}
          {data.map((point, index) => {
            const barHeight = Math.max(2, (point.score / maxScore) * height);
            const isLast = index === data.length - 1;

            return (
              <View key={`${point.date}-${index}`} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  {/* 점수 라벨 */}
                  {(isLast || index === 0) && (
                    <Text style={[styles.scoreLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                      {point.score}
                    </Text>
                  )}
                  {/* 바 */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isLast ? variantColor : `${variantColor}80`,
                        borderRadius: 4,
                      },
                    ]}
                    accessibilityLabel={`${point.label ?? point.date}: ${point.score}점`}
                  />
                </View>
                {/* 날짜 라벨 */}
                <Text
                  style={[styles.dateLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}
                  numberOfLines={1}
                >
                  {point.label ?? formatShortDate(point.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 빈 데이터 */}
      {data.length === 0 && (
        <View style={[styles.empty, { height }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm }}>
            아직 기록이 없어요
          </Text>
        </View>
      )}
    </View>
  );
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  trend: {
    fontWeight: '500',
  },
  chartContent: {
    paddingRight: spacing.sm,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    position: 'relative',
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  barWrapper: {
    alignItems: 'center',
    width: 32,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: 20,
    minHeight: 2,
  },
  scoreLabel: {
    marginBottom: spacing.xxs,
  },
  dateLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
