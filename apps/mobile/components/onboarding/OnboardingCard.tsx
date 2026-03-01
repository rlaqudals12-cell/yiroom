/**
 * OnboardingCard - 온보딩 카드 컴포넌트
 * 온보딩 단계별 카드를 표시한다.
 */
import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme } from '../../lib/theme';

export interface OnboardingCardProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  emoji?: string;
  onNext?: () => void;
  onSkip?: () => void;
  isLast?: boolean;
  style?: ViewStyle;
}

export function OnboardingCard({
  step,
  totalSteps,
  title,
  description,
  emoji,
  onNext,
  onSkip,
  isLast = false,
  style,
}: OnboardingCardProps): React.ReactElement {
  const { colors, brand, spacing, radii, typography } = useTheme();

  return (
    <View
      testID="onboarding-card"
      accessibilityLabel={`온보딩 ${step}/${totalSteps}단계, ${title}`}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.xl,
          alignItems: 'center',
        },
        style,
      ]}
    >
      {/* 이모지 */}
      {emoji ? (
        <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{emoji}</Text>
      ) : null}

      {/* 진행 표시 */}
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={{
              width: i + 1 === step ? 24 : 8,
              height: 8,
              borderRadius: radii.full,
              backgroundColor: i + 1 === step ? brand.primary : colors.secondary,
            }}
          />
        ))}
      </View>

      {/* 제목 */}
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>

      {/* 설명 */}
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: spacing.xl,
        }}
      >
        {description}
      </Text>

      {/* 버튼 영역 */}
      <View style={{ width: '100%', gap: spacing.sm }}>
        <Pressable
          testID="onboarding-next-button"
          accessibilityLabel={isLast ? '시작하기' : '다음'}
          onPress={onNext}
          style={{
            backgroundColor: brand.primary,
            borderRadius: radii.lg,
            paddingVertical: spacing.smx,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              color: brand.primaryForeground,
            }}
          >
            {isLast ? '시작하기' : '다음'}
          </Text>
        </Pressable>

        {!isLast && (
          <Pressable
            testID="onboarding-skip-button"
            accessibilityLabel="건너뛰기"
            onPress={onSkip}
            style={{ alignItems: 'center', paddingVertical: spacing.sm }}
          >
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
              건너뛰기
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
