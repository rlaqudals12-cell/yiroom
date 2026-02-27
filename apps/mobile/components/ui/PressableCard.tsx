/**
 * PressableCard — scale + haptic 피드백 카드
 *
 * 모든 터치 가능한 카드 UI에서 사용.
 * usePressScale(0.97) + expo-haptics 내장.
 * Card 스타일 + Pressable 인터랙션 통합.
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../lib/animations/hooks';
import { useTheme } from '../../lib/theme';

import { useAppPreferencesStore } from '@/lib/stores';

type HapticType = 'light' | 'medium' | 'heavy' | 'none';

interface PressableCardProps {
  /** press 핸들러 */
  onPress?: () => void;
  /** 햅틱 타입 (기본: light) */
  haptic?: HapticType;
  /** 카드 배경색 (기본: colors.card) */
  backgroundColor?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
  /** 접근성 라벨 */
  accessibilityLabel?: string;
  /** 콘텐츠 */
  children: React.ReactNode;
}

const HAPTIC_MAP: Record<Exclude<HapticType, 'none'>, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export function PressableCard({
  onPress,
  haptic = 'light',
  backgroundColor,
  disabled = false,
  style,
  testID = 'pressable-card',
  accessibilityLabel,
  children,
}: PressableCardProps): React.JSX.Element {
  const { colors, radii, shadows } = useTheme();
  const { onPressIn, onPressOut, animatedStyle } = usePressScale(0.97);
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  const handlePress = (): void => {
    if (disabled) return;

    if (hapticEnabled && haptic !== 'none') {
      Haptics.impactAsync(HAPTIC_MAP[haptic]);
    }

    onPress?.();
  };

  return (
    <Animated.View style={animatedStyle as ViewStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        style={[
          styles.card,
          shadows.card,
          {
            backgroundColor: backgroundColor ?? colors.card,
            borderColor: colors.border,
            borderRadius: radii.xl,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
