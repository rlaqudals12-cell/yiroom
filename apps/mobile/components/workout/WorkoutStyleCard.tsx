/**
 * 운동 스타일 카드
 *
 * 사용자 운동 스타일 매칭 결과 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii } from '../../lib/theme';

export interface WorkoutStyleCardProps {
  styleName: string;
  description: string;
  matchRate: number;
  characteristics: string[];
  recommendedExercises?: string[];
}

export function WorkoutStyleCard({
  styleName, description, matchRate, characteristics, recommendedExercises = [],
}: WorkoutStyleCardProps): React.ReactElement {
  const { colors, module, typography, radii, spacing } = useTheme();
  const baseColor = module.workout.base;

  return (
    <View
      testID="workout-style-card"
      style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.xl, borderColor: colors.border }]}
      accessibilityLabel={`운동 스타일: ${styleName}, 적합도 ${matchRate}%`}
    >
      <View style={styles.header}>
        <Text style={{ color: colors.foreground, fontSize: typography.size.lg, fontWeight: '700' }}>
          {styleName}
        </Text>
        <View style={[styles.matchBadge, { backgroundColor: `${baseColor}20`, borderRadius: radii.full }]}>
          <Text style={{ color: baseColor, fontSize: typography.size.sm, fontWeight: '700' }}>
            {matchRate}%
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.mutedForeground, fontSize: typography.size.sm, lineHeight: 20, marginTop: 6 }}>
        {description}
      </Text>

      <View style={[styles.charRow, { marginTop: spacing.sm }]}>
        {characteristics.slice(0, 4).map((char, i) => (
          <View key={i} style={[styles.charBadge, { backgroundColor: colors.secondary, borderRadius: radii.sm }]}>
            <Text style={{ color: colors.secondaryForeground, fontSize: typography.size.xs }}>{char}</Text>
          </View>
        ))}
      </View>

      {recommendedExercises.length > 0 && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, marginBottom: spacing.xs }}>추천 운동</Text>
          {recommendedExercises.slice(0, 3).map((ex, i) => (
            <Text key={i} style={{ color: colors.foreground, fontSize: typography.size.xs, lineHeight: 18 }}>• {ex}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchBadge: { paddingHorizontal: spacing.smd, paddingVertical: spacing.xs },
  charRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  charBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
});
