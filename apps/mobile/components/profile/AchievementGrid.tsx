/**
 * AchievementGrid — 업적 뱃지 그리드
 *
 * 3열 그리드로 업적 뱃지를 표시. 잠금/해제 상태 시각적 구분.
 */
import { FlatList, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme , spacing } from '../../lib/theme';
import { TIMING } from '../../lib/animations';
import type { Achievement } from '../../hooks/useWellnessScore';

interface AchievementGridProps {
  achievements: Achievement[];
  style?: ViewStyle;
  testID?: string;
}

export function AchievementGrid({
  achievements,
  style,
  testID,
}: AchievementGridProps): React.JSX.Element {
  const { colors, spacing, radii, typography, shadows } = useTheme();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Animated.View
      entering={FadeInUp.duration(TIMING.normal)}
      testID={testID}
      accessibilityLabel={`업적 ${unlockedCount}/${achievements.length}개 달성`}
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { marginBottom: spacing.sm + 4 }]}>
        <Text
          accessibilityRole="header"
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          나의 업적
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
          }}
        >
          {unlockedCount}/{achievements.length}
        </Text>
      </View>

      {/* 격려 메시지 (전부 잠금일 때) */}
      {unlockedCount === 0 && (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          활동을 시작하면 뱃지를 획득할 수 있어요
        </Text>
      )}

      {/* 그리드 */}
      <FlatList
        data={achievements}
        numColumns={3}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <AchievementItem achievement={item} />
        )}
      />
    </Animated.View>
  );
}

function AchievementItem({
  achievement,
}: {
  achievement: Achievement;
}): React.JSX.Element {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: achievement.unlocked ? colors.secondary : colors.muted,
          borderRadius: radii.lg,
          padding: spacing.sm,
          opacity: achievement.unlocked ? 1 : 0.5,
        },
      ]}
      accessibilityLabel={
        achievement.unlocked
          ? `${achievement.title} 달성 완료`
          : `${achievement.title} 미달성`
      }
    >
      <Text style={styles.emoji}>
        {achievement.unlocked ? achievement.emoji : '🔒'}
      </Text>
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.medium,
          color: achievement.unlocked ? colors.foreground : colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.xs,
        }}
        numberOfLines={1}
      >
        {achievement.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  emoji: {
    fontSize: 24,
  },
});
