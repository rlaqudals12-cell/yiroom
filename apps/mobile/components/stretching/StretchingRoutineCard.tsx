/**
 * StretchingRoutineCard - 스트레칭 루틴 카드
 * 스트레칭 루틴 요약 정보를 표시한다.
 */
import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface StretchingRoutineCardProps {
  id: string;
  name: string;
  description?: string;
  exerciseCount: number;
  totalMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  onPress?: (id: string) => void;
  style?: ViewStyle;
}

const DIFFICULTY_EMOJI: Record<string, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export function StretchingRoutineCard({
  id,
  name,
  description,
  exerciseCount,
  totalMinutes,
  difficulty,
  onPress,
  style,
}: StretchingRoutineCardProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography, module: moduleColors } = useTheme();

  return (
    <Pressable
      testID="stretching-routine-card"
      accessibilityLabel={`${name} 루틴, ${exerciseCount}개 동작, ${totalMinutes}분`}
      onPress={() => onPress?.(id)}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: moduleColors.workout.base,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xxs,
        }}
      >
        {name}
      </Text>

      {description ? (
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.mutedForeground,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {DIFFICULTY_EMOJI[difficulty]} {DIFFICULTY_LABEL[difficulty]}
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {exerciseCount}개 동작
        </Text>
        <Text style={{ fontSize: typography.size.sm, color: brand.primary, fontWeight: typography.weight.semibold }}>
          {totalMinutes}분
        </Text>
      </View>
    </Pressable>
  );
}
