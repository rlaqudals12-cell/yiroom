/**
 * MonthlyReportCard — 월별 피부 리포트 카드
 *
 * 월간 피부 상태 요약: 좋음/보통/나쁨 비율, 평균 점수, 트렌드.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme, spacing} from '../../lib/theme';

export interface MonthlyReportCardProps {
  year: number;
  month: number;
  totalDays: number;
  goodDays: number;
  normalDays: number;
  badDays: number;
  averageScore?: number;
  trend?: 'improving' | 'stable' | 'declining';
  style?: ViewStyle;
}

export function MonthlyReportCard({
  year,
  month,
  totalDays,
  goodDays,
  normalDays,
  badDays,
  averageScore,
  trend,
  style,
}: MonthlyReportCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status, module } = useTheme();

  const trendLabel = trend === 'improving' ? '개선 중' : trend === 'declining' ? '주의 필요' : '유지 중';
  const trendColor = trend === 'improving' ? status.success : trend === 'declining' ? status.error : status.warning;
  const total = goodDays + normalDays + badDays;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="monthly-report-card"
      accessibilityLabel={`${year}년 ${month}월 피부 리포트, ${totalDays}일 기록, 좋음 ${goodDays}일`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
          }}
        >
          {year}년 {month}월 리포트
        </Text>
        {trend && (
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              color: trendColor,
            }}
          >
            {trendLabel}
          </Text>
        )}
      </View>

      {/* 기록 일수 */}
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
        }}
      >
        {totalDays}일 기록
      </Text>

      {/* 비율 바 */}
      {total > 0 && (
        <View style={[styles.barContainer, { marginTop: spacing.sm, borderRadius: radii.sm }]}>
          <View
            style={[
              styles.barSegment,
              {
                backgroundColor: status.success,
                flex: goodDays,
                borderTopLeftRadius: radii.sm,
                borderBottomLeftRadius: radii.sm,
              },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              { backgroundColor: status.warning, flex: normalDays },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              {
                backgroundColor: status.error,
                flex: badDays,
                borderTopRightRadius: radii.sm,
                borderBottomRightRadius: radii.sm,
              },
            ]}
          />
        </View>
      )}

      {/* 통계 */}
      <View style={[styles.statsRow, { marginTop: spacing.sm, gap: spacing.md }]}>
        <View style={styles.stat}>
          <View style={[styles.statDot, { backgroundColor: status.success }]} />
          <Text style={{ fontSize: typography.size.sm, color: colors.foreground }}>
            좋음 {goodDays}일
          </Text>
        </View>
        <View style={styles.stat}>
          <View style={[styles.statDot, { backgroundColor: status.warning }]} />
          <Text style={{ fontSize: typography.size.sm, color: colors.foreground }}>
            보통 {normalDays}일
          </Text>
        </View>
        <View style={styles.stat}>
          <View style={[styles.statDot, { backgroundColor: status.error }]} />
          <Text style={{ fontSize: typography.size.sm, color: colors.foreground }}>
            나쁨 {badDays}일
          </Text>
        </View>
      </View>

      {/* 평균 점수 */}
      {averageScore !== undefined && (
        <View style={[styles.scoreRow, { marginTop: spacing.sm }]}>
          <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
            평균 점수
          </Text>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: module.skin.base,
            }}
          >
            {averageScore}점
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    height: 8,
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
