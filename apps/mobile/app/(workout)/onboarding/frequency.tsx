/**
 * W-1 운동 온보딩 - 빈도 설정
 */
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, radii , spacing } from '@/lib/theme';

// 주당 운동 횟수 옵션 (2-6회)
const FREQUENCY_OPTIONS = [
  { value: 2, label: '주 2회', description: '가볍게 시작해요', emoji: '🌱' },
  { value: 3, label: '주 3회', description: '균형 잡힌 운동', emoji: '🌿' },
  { value: 4, label: '주 4회', description: '적극적인 운동', emoji: '🌳' },
  { value: 5, label: '주 5회', description: '열정적인 운동', emoji: '💪' },
  { value: 6, label: '주 6회', description: '고강도 트레이닝', emoji: '🔥' },
];

// 선호 운동 시간대 옵션
const TIME_OPTIONS = [
  { id: 'morning', label: '아침', emoji: '🌅', description: '6시~12시' },
  { id: 'afternoon', label: '점심', emoji: '☀️', description: '12시~18시' },
  { id: 'evening', label: '저녁', emoji: '🌆', description: '18시~21시' },
  { id: 'night', label: '밤', emoji: '🌙', description: '21시~24시' },
];

export default function WorkoutFrequencyScreen() {
  const { colors, brand, typography, spacing, radii, shadows, isDark } = useTheme();
  const params = useLocalSearchParams<{ goals?: string }>();

  const [frequency, setFrequency] = useState<number | null>(null);
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  // 주당 횟수 선택 핸들러
  const handleFrequencySelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFrequency(value);
  };

  // 시간대 선택 핸들러
  const handleTimeSelect = (timeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferredTime(timeId);
  };

  // 다음 단계로 이동
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '/(workout)/result',
      params: {
        goals: params.goals || '[]',
        frequency: frequency?.toString() || '',
        preferredTime: preferredTime || '',
      },
    });
  };

  const isValid = frequency !== null && preferredTime !== null;

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="workout-onboarding-frequency-screen"
    >
        {/* 주당 운동 횟수 */}
        <Text style={[styles.title, { color: colors.foreground }]}>주당 운동 횟수</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          일주일에 몇 번 운동할 수 있나요?
        </Text>

        <Animated.View
          entering={FadeInUp.delay(100).duration(TIMING.normal)}
          style={styles.frequencyList}
        >
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = frequency === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.frequencyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? brand.primary : colors.border,
                    ...(isSelected ? { backgroundColor: brand.primary + '10' } : {}),
                  },
                  shadows.card,
                ]}
                onPress={() => handleFrequencySelect(option.value)}
              >
                <Text style={styles.frequencyEmoji}>{option.emoji}</Text>
                <View style={styles.frequencyContent}>
                  <Text
                    style={[
                      styles.frequencyLabel,
                      { color: colors.foreground },
                      isSelected && { color: brand.primary },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[styles.frequencyDescription, { color: colors.mutedForeground }]}>
                    {option.description}
                  </Text>
                </View>
                <View style={[styles.radio, { borderColor: colors.border }, isSelected && { borderColor: brand.primary }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: brand.primary }]} />}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* 선호 운동 시간대 */}
        <Text style={[styles.title, styles.sectionMargin, { color: colors.foreground }]}>
          선호 운동 시간대
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          주로 어느 시간대에 운동하시나요?
        </Text>

        <Animated.View
          entering={FadeInUp.delay(200).duration(TIMING.normal)}
          style={styles.timeGrid}
        >
          {TIME_OPTIONS.map((option) => {
            const isSelected = preferredTime === option.id;

            return (
              <Pressable
                key={option.id}
                style={[
                  styles.timeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? brand.primary : colors.border,
                    ...(isSelected ? { backgroundColor: brand.primary + '10' } : {}),
                  },
                  shadows.card,
                ]}
                onPress={() => handleTimeSelect(option.id)}
              >
                <Text style={styles.timeEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.timeLabel,
                    { color: colors.foreground },
                    isSelected && { color: brand.primary },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={[styles.timeDescription, { color: colors.mutedForeground }]}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: brand.primary },
            !isValid && { backgroundColor: colors.muted },
            isValid && !isDark ? Platform.select({
              ios: { shadowColor: brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
              android: { elevation: 4 },
            }) ?? {} : {},
          ]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={[styles.nextButtonText, { color: brand.primaryForeground }]}>운동 타입 분석하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  sectionMargin: {
    marginTop: spacing.xl,
  },
  // 주당 횟수 카드 스타일
  frequencyList: {
    gap: spacing.smx,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  frequencyCardSelected: {},
  frequencyEmoji: {
    fontSize: 28,
    marginRight: spacing.smx,
  },
  frequencyContent: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  frequencyLabelSelected: {},
  frequencyDescription: {
    fontSize: 13,
  },
  // 라디오 버튼 스타일
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {},
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: radii.sm,
  },
  // 시간대 그리드 스타일
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.smx,
  },
  timeCard: {
    width: '47%',
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeCardSelected: {},
  timeEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  timeLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  timeLabelSelected: {},
  timeDescription: {
    fontSize: 13,
  },
  // Footer 스타일
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: radii.full,
    padding: spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
