/**
 * CapsuleProgressBar — N/OptimalN 진행률 바
 *
 * 도메인 캡슐의 아이템 수를 최적 N 대비 시각적으로 표현.
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

interface CapsuleProgressBarProps {
  /** 현재 아이템 수 */
  current: number;
  /** 최적 아이템 수 */
  optimal: number;
  /** 악센트 색상 (모듈별) */
  accentColor?: string;
  /** 라벨 표시 여부 (기본: true) */
  showLabel?: boolean;
  testID?: string;
}

export function CapsuleProgressBar({
  current,
  optimal,
  accentColor,
  showLabel = true,
  testID,
}: CapsuleProgressBarProps): React.JSX.Element {
  const { colors, brand, radii, typography } = useTheme();

  const progress = optimal > 0 ? Math.min(current / optimal, 1) : 0;
  const percentage = Math.round(progress * 100);
  const gradientStart = accentColor ?? brand.primary;
  const gradientEnd = accentColor ? `${accentColor}99` : brand.gradientEnd;

  return (
    <View testID={testID} style={styles.container}>
      {showLabel ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
            {current}/{optimal}
          </Text>
          <Text style={[styles.label, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
            {percentage}%
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: radii.full }]}>
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.fill,
            { width: `${percentage}%` as unknown as number, borderRadius: radii.full },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '500',
  },
  track: {
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
