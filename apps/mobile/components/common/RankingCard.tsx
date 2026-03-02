/**
 * 랭킹 카드 (리더보드 표시)
 *
 * 순위, 사용자, 점수를 한 줄로 표시
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, spacing, radii, typography } from '../../lib/theme';

export interface RankingItem {
  rank: number;
  name: string;
  score: number;
  /** 순위 변동: positive=상승, negative=하락, 0=유지 */
  rankChange?: number;
  /** 아바타 이니셜 또는 이모지 */
  avatar?: string;
  /** 본인 여부 */
  isMe?: boolean;
}

export interface RankingCardProps {
  item: RankingItem;
  /** 점수 단위 */
  scoreUnit?: string;
  onPress?: () => void;
}

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function RankingCard({
  item,
  scoreUnit = '점',
  onPress,
}: RankingCardProps): React.ReactElement {
  const { colors, brand, status, typography } = useTheme();

  const rankDisplay = RANK_MEDALS[item.rank] ?? `${item.rank}`;
  const changeArrow =
    item.rankChange != null && item.rankChange > 0
      ? '▲'
      : item.rankChange != null && item.rankChange < 0
        ? '▼'
        : null;
  const changeColor =
    item.rankChange != null && item.rankChange > 0
      ? status.success
      : item.rankChange != null && item.rankChange < 0
        ? colors.destructive
        : colors.mutedForeground;

  const Container = onPress ? Pressable : View;

  return (
    <Container
      {...(onPress ? { onPress } : {})}
      style={[
        styles.container,
        {
          backgroundColor: item.isMe ? `${brand.primary}10` : colors.card,
          borderColor: item.isMe ? brand.primary : colors.border,
        },
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${item.rank}위 ${item.name} ${item.score}${scoreUnit}`}
      testID="ranking-card"
    >
      {/* 순위 */}
      <View style={styles.rankSection}>
        <Text style={[styles.rankText, { fontSize: item.rank <= 3 ? 20 : typography.size.base }]}>
          {rankDisplay}
        </Text>
        {changeArrow && (
          <Text style={[styles.changeText, { color: changeColor, fontSize: typography.size.xs }]}>
            {changeArrow}{Math.abs(item.rankChange!)}
          </Text>
        )}
      </View>

      {/* 아바타 + 이름 */}
      <View style={styles.userSection}>
        <View style={[styles.avatar, { backgroundColor: `${brand.primary}20` }]}>
          <Text style={[styles.avatarText, { color: brand.primary }]}>
            {item.avatar ?? item.name.charAt(0)}
          </Text>
        </View>
        <Text
          style={[
            styles.name,
            {
              color: colors.foreground,
              fontSize: typography.size.sm,
              fontWeight: item.isMe ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {item.name}
          {item.isMe && ' (나)'}
        </Text>
      </View>

      {/* 점수 */}
      <Text style={[styles.score, { color: brand.primary, fontSize: typography.size.base }]}>
        {item.score.toLocaleString()}{scoreUnit}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.smx,
    borderRadius: radii.smx,
    borderWidth: 1,
  },
  rankSection: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '700',
  },
  changeText: {
    marginTop: spacing.xxs,
    fontWeight: '500',
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  avatar: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  name: {
    flex: 1,
  },
  score: {
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
