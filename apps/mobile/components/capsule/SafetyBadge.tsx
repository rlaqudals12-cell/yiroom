/**
 * SafetyBadge — 안전성 등급 배지
 *
 * BLOCK/WARN/INFO 수준에 따라 색상과 아이콘이 다른 배지.
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

type SafetyLevel = 'block' | 'warn' | 'info' | 'safe';

interface SafetyBadgeProps {
  level: SafetyLevel;
  label?: string;
  testID?: string;
}

const LEVEL_CONFIG: Record<SafetyLevel, { emoji: string; defaultLabel: string; bgLight: string; bgDark: string; textLight: string; textDark: string }> = {
  block: { emoji: '🚫', defaultLabel: '차단', bgLight: '#FEE2E2', bgDark: '#3B1111', textLight: '#DC2626', textDark: '#FCA5A5' },
  warn:  { emoji: '⚠️', defaultLabel: '주의', bgLight: '#FEF9C3', bgDark: '#3B3511', textLight: '#CA8A04', textDark: '#FDE68A' },
  info:  { emoji: 'ℹ️', defaultLabel: '참고', bgLight: '#DBEAFE', bgDark: '#111B3B', textLight: '#2563EB', textDark: '#93C5FD' },
  safe:  { emoji: '✅', defaultLabel: '안전', bgLight: '#DCFCE7', bgDark: '#113B11', textLight: '#16A34A', textDark: '#86EFAC' },
};

export function SafetyBadge({
  level,
  label,
  testID,
}: SafetyBadgeProps): React.JSX.Element {
  const { isDark, radii, typography } = useTheme();
  const config = LEVEL_CONFIG[level];

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: isDark ? config.bgDark : config.bgLight,
          borderRadius: radii.full,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${config.defaultLabel} 등급`}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text
        style={[
          styles.label,
          {
            color: isDark ? config.textDark : config.textLight,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  emoji: {
    fontSize: 12,
  },
  label: {},
});
