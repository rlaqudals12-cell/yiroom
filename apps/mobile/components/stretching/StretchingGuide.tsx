/**
 * StretchingGuide - 스트레칭 가이드 컴포넌트
 * 스트레칭 동작 단계별 안내를 표시한다.
 */
import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface StretchingStep {
  order: number;
  title: string;
  description: string;
  durationSeconds: number;
}

export interface StretchingGuideProps {
  name: string;
  targetArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: StretchingStep[];
  totalDuration?: number;
  style?: ViewStyle;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export function StretchingGuide({
  name,
  targetArea,
  difficulty,
  steps,
  totalDuration,
  style,
}: StretchingGuideProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography, status } = useTheme();

  const difficultyColor =
    difficulty === 'easy'
      ? status.success
      : difficulty === 'medium'
        ? status.warning
        : status.error;

  const total = totalDuration ?? steps.reduce((sum, s) => sum + s.durationSeconds, 0);

  return (
    <View
      testID="stretching-guide"
      accessibilityLabel={`${name} 스트레칭 가이드, ${steps.length}단계`}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {/* 헤더 */}
      <Text
        style={{
          fontSize: typography.size.xl,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        {name}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            backgroundColor: difficultyColor + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xxs,
            borderRadius: radii.full,
          }}
        >
          <Text style={{ fontSize: typography.size.xs, color: difficultyColor, fontWeight: typography.weight.semibold }}>
            {DIFFICULTY_LABEL[difficulty]}
          </Text>
        </View>

        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {targetArea}
        </Text>

        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
          {Math.ceil(total / 60)}분
        </Text>
      </View>

      {/* 단계 목록 */}
      {steps.map((step, index) => (
        <View
          key={step.order}
          style={{
            flexDirection: 'row',
            marginBottom: index < steps.length - 1 ? spacing.md : 0,
          }}
        >
          {/* 번호 원 */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.full,
              backgroundColor: brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.smx,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
              }}
            >
              {step.order}
            </Text>
          </View>

          {/* 내용 */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.semibold,
                color: colors.foreground,
                marginBottom: spacing.xxs,
              }}
            >
              {step.title}
            </Text>
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginBottom: spacing.xxs,
              }}
            >
              {step.description}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: brand.primary,
                fontWeight: typography.weight.medium,
              }}
            >
              {step.durationSeconds}초
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
