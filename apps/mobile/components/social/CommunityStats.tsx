/**
 * CommunityStats — 커뮤니티 통계
 *
 * 전체 커뮤니티 활동 통계 요약 카드.
 */
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface CommunityStatsProps {
  totalMembers: number;
  activeToday: number;
  postsToday: number;
  encouragementsToday: number;
  style?: ViewStyle;
}

export function CommunityStats({
  totalMembers,
  activeToday,
  postsToday,
  encouragementsToday,
  style,
}: CommunityStatsProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

  const stats = [
    { label: '전체', value: totalMembers, emoji: '👥' },
    { label: '오늘 활동', value: activeToday, emoji: '🟢' },
    { label: '게시물', value: postsToday, emoji: '📝' },
    { label: '응원', value: encouragementsToday, emoji: '🔔' },
  ];

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
      testID="community-stats"
      accessibilityLabel={`커뮤니티 통계, ${totalMembers}명 중 ${activeToday}명 활동`}
    >
      <Text
        style={{
          fontSize: typography.size.base,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        커뮤니티
      </Text>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={{ fontSize: typography.size.base }}>{stat.emoji}</Text>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginTop: spacing.xxs,
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
});
