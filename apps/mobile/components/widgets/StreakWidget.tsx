/**
 * 스트릭 위젯
 * 연속 달성 일수와 배지 표시
 */

import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../lib/theme';

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
  const { isDark } = useTheme();

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
      <View style={[styles.containerSmall, isDark && styles.containerDark]}>
        <Text style={styles.emoji}>{level.emoji}</Text>
        <Text style={[styles.streakNumber, isDark && styles.textLight]}>{streak}</Text>
        <Text style={[styles.streakLabel, isDark && styles.textMuted]}>일 연속</Text>
      </View>
    );
  }

  return (
    <View style={[styles.containerMedium, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textLight]}>연속 기록</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level.label}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.streakMain}>
          <Text style={styles.bigEmoji}>{level.emoji}</Text>
          <View>
            <Text style={[styles.streakBig, isDark && styles.textLight]}>{streak}일</Text>
            <Text style={[styles.longestStreak, isDark && styles.textMuted]}>
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
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
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  levelBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    gap: 12,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  bigEmoji: {
    fontSize: 48,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  streakBig: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  longestStreak: {
    fontSize: 13,
    color: '#666',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
