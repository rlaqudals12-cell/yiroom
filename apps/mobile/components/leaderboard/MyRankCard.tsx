/**
 * MyRankCard -- 나의 순위 카드
 *
 * 사용자의 리더보드 순위, 총 참가자 수, 점수, 상위 백분율 표시.
 * 순위 변동에 따른 시각적 피드백 제공.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface MyRankCardProps {
  /** 현재 순위 */
  rank: number;
  /** 전체 참가자 수 */
  totalUsers: number;
  /** 나의 점수 */
  score: number;
  /** 상위 퍼센타일 (0-100, 예: 5 = 상위 5%) */
  percentile: number;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function MyRankCard({
  rank,
  totalUsers,
  score,
  percentile,
  style,
  testID = 'my-rank-card',
}: MyRankCardProps): React.JSX.Element {
  const { colors, brand, module, typography, radii, spacing, shadows, isDark } = useTheme();
  const accentColor = module.workout.base;

  // 상위 퍼센타일에 따른 색상 결정
  const percentileColor =
    percentile <= 10
      ? module.workout.dark
      : percentile <= 30
        ? module.workout.base
        : colors.mutedForeground;

  // 순위 텍스트 포맷
  const rankDisplay = rank <= 0 ? '-' : `${rank}`;
  const clampedPercentile = Math.max(0, Math.min(percentile, 100));

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
        },
        style,
      ]}
      accessibilityLabel={`나의 순위 ${rankDisplay}위, ${totalUsers}명 중, ${score}점, 상위 ${clampedPercentile}%`}
    >
      {/* 상단 악센트 바 */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: accentColor, borderRadius: radii.full },
        ]}
      />

      <View style={styles.content}>
        {/* 왼쪽: 순위 */}
        <View style={styles.rankSection}>
          <Text
            style={{
              color: accentColor,
              fontSize: typography.size['3xl'],
              fontWeight: typography.weight.bold,
            }}
          >
            {rankDisplay}
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
            }}
          >
            / {totalUsers}명
          </Text>
        </View>

        {/* 구분선 */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 오른쪽: 점수 + 상위 % */}
        <View style={styles.statsSection}>
          {/* 점수 */}
          <View style={styles.statRow}>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: typography.size.xs,
              }}
            >
              점수
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
              }}
            >
              {score.toLocaleString()}
            </Text>
          </View>

          {/* 상위 퍼센타일 */}
          <View style={[styles.percentileBadge, { marginTop: spacing.sm }]}>
            <View
              style={[
                styles.percentileTag,
                {
                  backgroundColor: `${percentileColor}15`,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Text
                style={{
                  color: percentileColor,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                }}
              >
                상위 {clampedPercentile}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    marginHorizontal: spacing.md,
    marginTop: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.md + spacing.xxs,
  },
  rankSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  divider: {
    width: 1,
    height: '80%',
    marginHorizontal: spacing.md,
  },
  statsSection: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentileBadge: {
    alignItems: 'flex-start',
  },
  percentileTag: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xs,
  },
});
