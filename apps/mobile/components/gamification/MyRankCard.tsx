/**
 * MyRankCard — 내 순위 카드
 *
 * 현재 사용자의 리더보드 순위를 강조 표시.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface MyRankCardProps {
  rank: number;
  totalUsers: number;
  score: number;
  percentile?: number;
  style?: ViewStyle;
}

export function MyRankCard({
  rank,
  totalUsers,
  score,
  percentile,
  style,
}: MyRankCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  const topPercent = percentile ?? (totalUsers > 0 ? Math.round((rank / totalUsers) * 100) : 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: brand.primary,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="my-rank-card"
      accessibilityLabel={`내 순위 ${rank}위, 상위 ${topPercent}%`}
    >
      <Text
        style={{
          fontSize: typography.size.sm,
          color: brand.primaryForeground,
          opacity: 0.8,
        }}
      >
        내 순위
      </Text>
      <View style={[styles.rankRow, { marginTop: spacing.xs }]}>
        <Text
          style={{
            fontSize: typography.size['3xl'],
            fontWeight: typography.weight.bold,
            color: brand.primaryForeground,
          }}
        >
          {rank}위
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: brand.primaryForeground,
            opacity: 0.8,
          }}
        >
          / {totalUsers}명
        </Text>
      </View>
      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: brand.primaryForeground,
          }}
        >
          {score}점
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
            color: brand.primaryForeground,
          }}
        >
          상위 {topPercent}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  rankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
