/**
 * 운동 유형 카드
 *
 * 5-Type 운동 유형 선택/표시
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'balance' | 'hiit';

export interface WorkoutTypeCardProps {
  type: WorkoutType;
  isSelected?: boolean;
  count?: number;
  onPress?: (type: WorkoutType) => void;
}

const TYPE_INFO: Record<WorkoutType, { label: string; emoji: string; description: string }> = {
  strength: { label: '근력', emoji: '💪', description: '근육 강화 운동' },
  cardio: { label: '유산소', emoji: '🏃', description: '심폐 지구력 운동' },
  flexibility: { label: '유연성', emoji: '🧘', description: '스트레칭/요가' },
  balance: { label: '균형', emoji: '⚖️', description: '코어/밸런스 운동' },
  hiit: { label: 'HIIT', emoji: '🔥', description: '고강도 인터벌' },
};

export function WorkoutTypeCard({
  type, isSelected = false, count, onPress,
}: WorkoutTypeCardProps): React.ReactElement {
  const { colors, module, typography, radii, spacing } = useTheme();
  const info = TYPE_INFO[type];
  const baseColor = module.workout.base;

  return (
    <Pressable
      testID="workout-type-card"
      onPress={() => onPress?.(type)}
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? `${baseColor}15` : colors.card,
          borderRadius: radii.lg,
          borderColor: isSelected ? baseColor : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${info.label} 운동 유형${isSelected ? ', 선택됨' : ''}`}
    >
      <Text style={{ fontSize: typography.size['2xl'] }}>{info.emoji}</Text>
      <Text style={{ color: isSelected ? baseColor : colors.foreground, fontSize: typography.size.sm, fontWeight: '700', marginTop: 4 }}>
        {info.label}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: typography.size.xs, textAlign: 'center' }}>
        {info.description}
      </Text>
      {count !== undefined && (
        <Text style={{ color: baseColor, fontSize: typography.size.xs, fontWeight: '600', marginTop: 4 }}>
          {count}개
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14, alignItems: 'center', width: '48%' },
});
