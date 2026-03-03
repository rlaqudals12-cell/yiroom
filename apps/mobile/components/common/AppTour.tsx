/**
 * AppTour -- 앱 투어 오버레이
 *
 * 온보딩용 투어: 반투명 오버레이 위에 단계별 툴팁 카드.
 * 스텝 인디케이터, 다음/건너뛰기 버튼 제공.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface TourStep {
  title: string;
  description: string;
  position: 'top' | 'center' | 'bottom';
}

export interface AppTourProps {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
  isVisible: boolean;
  testID?: string;
}

export function AppTour({
  steps,
  currentStep,
  onNext,
  onSkip,
  isVisible,
  testID = 'app-tour',
}: AppTourProps): React.JSX.Element | null {
  const { colors, spacing, typography, radii, brand } = useTheme();

  if (!isVisible || steps.length === 0) return null;

  const step = steps[Math.min(currentStep, steps.length - 1)];
  const isLastStep = currentStep >= steps.length - 1;

  // 카드 위치 결정
  const cardPositionStyle =
    step.position === 'top'
      ? { justifyContent: 'flex-start' as const, paddingTop: 80 }
      : step.position === 'bottom'
        ? { justifyContent: 'flex-end' as const, paddingBottom: 120 }
        : { justifyContent: 'center' as const };

  const handleNext = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  };

  const handleSkip = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <Modal transparent visible={isVisible} animationType="none" testID={testID}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.overlay, cardPositionStyle]}
      >
        {/* 닫기 버튼 */}
        <Pressable
          style={[styles.closeBtn, { top: 50, right: spacing.md }]}
          onPress={handleSkip}
          accessibilityLabel="투어 건너뛰기"
          accessibilityRole="button"
        >
          <X size={24} color={colors.overlayForeground} />
        </Pressable>

        {/* 투어 카드 */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              padding: spacing.lg,
              marginHorizontal: spacing.lg,
            },
          ]}
        >
          {/* 스텝 인디케이터 */}
          <View style={[styles.stepIndicator, { marginBottom: spacing.sm }]}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: index === currentStep ? 20 : 8,
                    height: 8,
                    borderRadius: radii.full,
                    backgroundColor: index === currentStep ? brand.primary : colors.secondary,
                    marginHorizontal: spacing.xxs,
                  },
                ]}
              />
            ))}
          </View>

          {/* 제목 */}
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: spacing.xs,
            }}
          >
            {step.title}
          </Text>

          {/* 설명 */}
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: typography.size.sm * typography.lineHeight.relaxed,
              marginBottom: spacing.md,
            }}
          >
            {step.description}
          </Text>

          {/* 버튼 영역 */}
          <View style={styles.buttons}>
            <Pressable
              style={[
                styles.skipBtn,
                {
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={handleSkip}
              accessibilityLabel="건너뛰기"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.medium,
                  color: colors.mutedForeground,
                }}
              >
                건너뛰기
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.nextBtn,
                {
                  backgroundColor: brand.primary,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.xl,
                },
              ]}
              onPress={handleNext}
              accessibilityLabel={isLastStep ? '완료' : '다음'}
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: brand.primaryForeground,
                }}
              >
                {isLastStep ? '완료' : '다음'}
              </Text>
            </Pressable>
          </View>

          {/* 스텝 카운터 */}
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            {currentStep + 1} / {steps.length}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 10,
    padding: spacing.sm,
  },
  card: {
    width: '100%',
    maxWidth: 340,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {},
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {},
  nextBtn: {},
});
