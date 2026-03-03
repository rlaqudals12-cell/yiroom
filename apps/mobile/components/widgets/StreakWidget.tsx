/**
 * 스트릭 위젯
 * 연속 달성 일수와 배지 표시
 */

import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography, spacing, radii } from '../../lib/theme';

interface StreakWidgetProps {
  streak: number;
  longestStreak: number;
  recentBadges?: string[];
  size?: 'small' | 'medium';
}

export function StreakWidget({
  streak,
  longestStreak,
  recentBadges = [],
  size = 'medium',
}: StreakWidgetProps) {
  const { colors, brand, typography } = useTheme();

  // 스트릭 레벨 계산
  const getStreakLevel = (days: number) => {
    if (days >= 100) return { emoji: '🏆', label: '레전드' };
    if (days >= 30) return { emoji: '🔥', label: '마스터' };
    if (days >= 7) return { emoji: '⭐', label: '챌린저' };
    if (days >= 3) return { emoji: '💪', label: '시작' };
    return { emoji: '🌱', label: '새싹' };
  };

  const level = getStreakLevel(streak);

  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, { backgroundColor: colors.card }]}>
        <Text style={styles.emoji}>{level.emoji}</Text>
        <Text style={[styles.streakNumber, { color: colors.foreground }]}>{streak}</Text>
        <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>일 연속</Text>
      </View>
    );
  }

  return (
    <View testID="streak-widget" style={[styles.containerMedium, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>연속 기록</Text>
        <View style={[styles.levelBadge, { backgroundColor: brand.primary }]}>
          <Text style={[styles.levelText, { color: brand.primaryForeground }]}>{level.label}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.streakMain}>
          <Text style={styles.bigEmoji}>{level.emoji}</Text>
          <View>
            <Text style={[styles.streakBig, { color: colors.foreground }]}>{streak}일</Text>
            <Text style={[styles.longestStreak, { color: colors.mutedForeground }]}>
              최고: {longestStreak}일
            </Text>
          </View>
        </View>

        {recentBadges.length > 0 && (
          <View style={styles.badgesRow}>
            {recentBadges.slice(0, 3).map((badge, i) => (
              <Text key={i} style={styles.badgeEmoji}>
                {badge}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerMedium: {
    width: 329,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  title: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
  },
  levelBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
  },
  levelText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  bigEmoji: {
    fontSize: 48,
  },
  streakNumber: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
  },
  streakLabel: {
    fontSize: typography.size.sm,
  },
  streakBig: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  longestStreak: {
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badgeEmoji: {
    fontSize: 28,
  },
});
