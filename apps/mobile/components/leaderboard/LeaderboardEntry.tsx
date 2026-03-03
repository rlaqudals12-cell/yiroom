/**
 * LeaderboardEntry -- 리더보드 단일 항목
 *
 * 순위, 이름, 점수를 한 행으로 표시.
 * 1~3위에 금/은/동 메달 아이콘, 본인 항목 강조 처리.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii } from '../../lib/theme';
import { gradeColors } from '../../lib/theme/tokens';

export interface LeaderboardEntryProps {
  /** 순위 */
  rank: number;
  /** 참가자 이름 */
  name: string;
  /** 점수 */
  score: number;
  /** 본인 여부 */
  isMe?: boolean;
  /** 아바타 URL (선택) */
  avatar?: string;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

/** 상위 3위 메달 표시 */
function getMedalInfo(rank: number): { emoji: string; color: string } | null {
  switch (rank) {
    case 1:
      return { emoji: '🥇', color: gradeColors.gold.base };
    case 2:
      return { emoji: '🥈', color: gradeColors.silver.base };
    case 3:
      return { emoji: '🥉', color: gradeColors.bronze.base };
    default:
      return null;
  }
}

export function LeaderboardEntry({
  rank,
  name,
  score,
  isMe = false,
  avatar,
  style,
  testID = 'leaderboard-entry',
}: LeaderboardEntryProps): React.JSX.Element {
  const { colors, brand, module, typography, radii, spacing, isDark } = useTheme();
  const medal = getMedalInfo(rank);

  // 본인 항목 강조 배경색
  const rowBg = isMe
    ? isDark
      ? `${brand.primary}15`
      : `${brand.primary}10`
    : 'transparent';

  const rowBorderColor = isMe ? brand.primary : 'transparent';

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: rowBg,
          borderColor: rowBorderColor,
          borderRadius: radii.xl,
        },
        isMe && styles.highlighted,
        style,
      ]}
      accessibilityLabel={`${rank}위 ${name}, ${score}점${isMe ? ', 나의 순위' : ''}`}
    >
      {/* 순위 */}
      <View style={[styles.rankContainer, { width: 36 }]}>
        {medal ? (
          <Text style={{ fontSize: typography.size.lg }}>{medal.emoji}</Text>
        ) : (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              textAlign: 'center',
            }}
          >
            {rank}
          </Text>
        )}
      </View>

      {/* 아바타 이니셜 */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isMe ? `${brand.primary}30` : colors.secondary,
            borderRadius: radii.full,
          },
        ]}
      >
        <Text
          style={{
            color: isMe ? brand.primaryForeground : colors.foreground,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
          }}
        >
          {name.charAt(0)}
        </Text>
      </View>

      {/* 이름 */}
      <View style={styles.nameContainer}>
        <Text
          style={{
            color: isMe ? colors.foreground : colors.foreground,
            fontSize: typography.size.sm,
            fontWeight: isMe ? typography.weight.bold : typography.weight.medium,
          }}
          numberOfLines={1}
        >
          {name}
          {isMe && (
            <Text
              style={{
                color: brand.primary,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
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
          color: medal ? medal.color : colors.foreground,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.bold,
        }}
      >
        {score.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.smd,
    gap: spacing.sm,
  },
  highlighted: {
    borderWidth: 1,
  },
  rankContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
});
