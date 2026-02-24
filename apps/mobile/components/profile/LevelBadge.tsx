/**
 * LevelBadge — 레벨 + 경험치 프로그레스 바
 *
 * 현재 레벨, 타이틀, XP 진행도를 표시.
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import type { WellnessLevel } from '../../hooks/useWellnessScore';

interface LevelBadgeProps {
  level: WellnessLevel;
  style?: ViewStyle;
  testID?: string;
}

export function LevelBadge({
  level,
  style,
  testID,
}: LevelBadgeProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();

  const progress = level.nextLevelXp > 0
    ? Math.min((level.xp / level.nextLevelXp) * 100, 100)
    : 100;

  return (
    <View
      testID={testID}
      accessibilityLabel={`레벨 ${level.level} ${level.title}, 경험치 ${level.xp}/${level.nextLevelXp}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.secondary,
          borderRadius: radii.lg,
          padding: spacing.sm + 4,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {/* 레벨 뱃지 */}
        <View
          style={[
            styles.levelCircle,
            { backgroundColor: brand.primary },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: brand.primaryForeground,
            }}
          >
            Lv.{level.level}
          </Text>
        </View>

        {/* 타이틀 + 프로그레스 */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
              }}
            >
              {level.title}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              {level.xp}/{level.nextLevelXp}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: brand.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
