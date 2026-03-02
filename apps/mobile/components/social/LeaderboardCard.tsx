/**
 * LeaderboardCard -- 리더보드 카드
 *
 * 랭킹 순위 행: 순위(1~3위 메달), 아바타, 사용자명, 점수.
 * 현재 사용자 행은 brand.primary 배경으로 강조.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';

import { useTheme } from '../../lib/theme';

export interface LeaderboardCardProps {
  rank: number;
  username: string;
  score: number;
  isCurrentUser?: boolean;
  avatarUrl?: string;
  testID?: string;
}

// 1~3위 메달 색상
const MEDAL_COLORS: Record<number, string> = {
  1: '#FFD700', // 금
  2: '#C0C0C0', // 은
  3: '#CD7F32', // 동
};

export function LeaderboardCard({
  rank,
  username,
  score,
  isCurrentUser = false,
  avatarUrl,
  testID = 'leaderboard-card',
}: LeaderboardCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  const medalColor = MEDAL_COLORS[rank];
  const isTopThree = rank >= 1 && rank <= 3;

  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 60).duration(300)}
      style={[
        styles.row,
        {
          backgroundColor: isCurrentUser ? `${brand.primary}18` : colors.card,
          borderRadius: radii.xl,
          padding: spacing.sm,
          borderWidth: isCurrentUser ? 1 : 0,
          borderColor: isCurrentUser ? brand.primary : 'transparent',
          ...shadows.sm,
        },
      ]}
      testID={testID}
      accessibilityLabel={`${rank}위 ${username}, ${score}점${isCurrentUser ? ', 나' : ''}`}
    >
      {/* 순위 */}
      <View style={[styles.rankArea, { width: 36, height: 36 }]}>
        {isTopThree ? (
          <View
            style={[
              styles.medalCircle,
              {
                backgroundColor: `${medalColor}20`,
                borderRadius: radii.full,
                width: 36,
                height: 36,
              },
            ]}
          >
            <Trophy size={16} color={medalColor} />
          </View>
        ) : (
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.mutedForeground,
              textAlign: 'center',
            }}
          >
            {rank}
          </Text>
        )}
      </View>

      {/* 아바타 */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isCurrentUser ? brand.primary : colors.secondary,
            borderRadius: radii.full,
            width: 32,
            height: 32,
            marginLeft: spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: isCurrentUser ? brand.primaryForeground : colors.mutedForeground,
          }}
        >
          {username.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* 사용자명 */}
      <View style={[styles.nameArea, { marginLeft: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: isCurrentUser ? typography.weight.bold : typography.weight.medium,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {username}
          {isCurrentUser && (
            <Text
              style={{
                fontSize: typography.size.xs,
                color: brand.primary,
                fontWeight: typography.weight.semibold,
              }}
            >
              {' '}(나)
            </Text>
          )}
        </Text>
      </View>

      {/* 점수 */}
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: isTopThree ? (medalColor ?? colors.foreground) : colors.foreground,
        }}
      >
        {score.toLocaleString()}
        <Text
          style={{
            fontSize: typography.size.xs,
            fontWeight: typography.weight.normal,
            color: colors.mutedForeground,
          }}
        >
          점
        </Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameArea: {
    flex: 1,
  },
});
