/**
 * LeaderboardCard — 리더보드 항목 카드
 *
 * 리더보드의 개별 순위 항목. 순위, 이름, 점수 표시.
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface LeaderboardCardProps {
  rank: number;
  userName: string;
  score: number;
  isCurrentUser?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const LeaderboardCard = memo(function LeaderboardCard({
  rank,
  userName,
  score,
  isCurrentUser = false,
  onPress,
  style,
}: LeaderboardCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, grade, brand } = useTheme();

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: isCurrentUser ? brand.primary : colors.card,
          borderRadius: radii.lg,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID="leaderboard-card"
      accessibilityLabel={`${rank}위 ${userName}, ${score}점${isCurrentUser ? ', 내 순위' : ''}`}
    >
      <View style={[styles.rankContainer, { minWidth: 32 }]}>
        {rankEmoji ? (
          <Text style={{ fontSize: typography.size.base }}>{rankEmoji}</Text>
        ) : (
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: isCurrentUser ? brand.primaryForeground : colors.mutedForeground,
            }}
          >
            {rank}
          </Text>
        )}
      </View>

      <Text
        style={{
          flex: 1,
          fontSize: typography.size.sm,
          fontWeight: isCurrentUser ? typography.weight.bold : typography.weight.medium,
          color: isCurrentUser ? brand.primaryForeground : colors.foreground,
          marginLeft: spacing.sm,
        }}
        numberOfLines={1}
      >
        {userName}
      </Text>

      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
          color: isCurrentUser ? brand.primaryForeground : grade.gold.text,
        }}
      >
        {score}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    alignItems: 'center',
  },
});
