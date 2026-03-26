/**
 * W-1 운동 온보딩 - 빈도 설정
 * UX v3: GlassCard + GradientText 히어로 + 배경 그라디언트 + coloredShadow + a11y
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { Dumbbell, Flame } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  GlassCard,
  GradientText,
  ScalePressable,
  ScreenContainer,
  StepProgressBar,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, radii, spacing, coloredShadow } from '@/lib/theme';

const WORKOUT_ACCENT = '#10B981';

type FrequencyOption = {
  value: number;
  label: string;
  description: string;
} & ({ emoji: string; icon?: never } | { icon: LucideIcon; emoji?: never });

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 2, label: '주 2회', description: '가볍게 시작해요', emoji: '🌱' },
  { value: 3, label: '주 3회', description: '균형 잡힌 운동', emoji: '🌿' },
  { value: 4, label: '주 4회', description: '적극적인 운동', emoji: '🌳' },
  { value: 5, label: '주 5회', description: '열정적인 운동', icon: Dumbbell },
  { value: 6, label: '주 6회', description: '고강도 트레이닝', icon: Flame },
];

const TIME_OPTIONS = [
  { id: 'morning', label: '아침', emoji: '🌅', description: '6시~12시' },
  { id: 'afternoon', label: '점심', emoji: '☀️', description: '12시~18시' },
  { id: 'evening', label: '저녁', emoji: '🌆', description: '18시~21시' },
  { id: 'night', label: '밤', emoji: '🌙', description: '21시~24시' },
];

export default function WorkoutFrequencyScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ goals?: string }>();

  const [frequency, setFrequency] = useState<number | null>(null);
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  const handleFrequencySelect = (value: number): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFrequency(value);
  };

  const handleTimeSelect = (timeId: string): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreferredTime(timeId);
  };

  const handleNext = (): void => {
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
      backgroundGradient="workout"
      testID="workout-onboarding-frequency-screen"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="lg" glowColor={WORKOUT_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>⏱️</Text>
            <GradientText
              variant="extended"
              fontSize={22}
              fontWeight="700"
              style={styles.heroTitle}
            >
              운동 빈도 설정
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              나의 생활 패턴에 맞는 운동 빈도를 선택해주세요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 스텝 프로그레스 바 */}
      <StepProgressBar current={2} total={4} accentColor={WORKOUT_ACCENT} testID="step-progress" />

      {/* 주당 운동 횟수 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>주당 운동 횟수</Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          일주일에 몇 번 운동할 수 있나요?
        </Text>
      </Animated.View>

      <View style={styles.frequencyList}>
        {FREQUENCY_OPTIONS.map((option, idx) => {
          const isSelected = frequency === option.value;
          return (
            <Animated.View
              key={option.value}
              entering={FadeInUp.delay(120 + idx * 50).duration(TIMING.normal)}
            >
              <ScalePressable
                selected={isSelected}
                onPress={() => handleFrequencySelect(option.value)}
                accessibilityLabel={`${option.label}: ${option.description}`}
                style={[
                  styles.frequencyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? WORKOUT_ACCENT : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected ? { backgroundColor: `${WORKOUT_ACCENT}20` } : {},
                  isSelected && !isDark ? coloredShadow(WORKOUT_ACCENT, 'sm') : {},
                ]}
              >
                {option.icon ? (
                  <View style={styles.frequencyIconWrap}>
                    <option.icon
                      size={24}
                      color={isSelected ? WORKOUT_ACCENT : colors.mutedForeground}
                    />
                  </View>
                ) : (
                  <Text style={styles.frequencyEmoji}>{option.emoji}</Text>
                )}
                <View style={styles.frequencyContent}>
                  <Text
                    style={[
                      styles.frequencyLabel,
                      { color: isSelected ? WORKOUT_ACCENT : colors.foreground },
                      isSelected ? { fontWeight: typography.weight.bold } : {},
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[styles.frequencyDescription, { color: colors.mutedForeground }]}>
                    {option.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSelected ? WORKOUT_ACCENT : colors.border },
                  ]}
                >
                  {isSelected && (
                    <View style={[styles.radioInner, { backgroundColor: WORKOUT_ACCENT }]} />
                  )}
                </View>
              </ScalePressable>
            </Animated.View>
          );
        })}
      </View>

      {/* 선호 운동 시간대 */}
      <Animated.View entering={FadeInUp.delay(400).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: spacing.xl }]}>
          선호 운동 시간대
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          주로 어느 시간대에 운동하시나요?
        </Text>
      </Animated.View>

      <View style={styles.timeGrid}>
        {TIME_OPTIONS.map((option) => {
          const isSelected = preferredTime === option.id;
          return (
            <ScalePressable
              key={option.id}
              selected={isSelected}
              onPress={() => handleTimeSelect(option.id)}
              accessibilityLabel={`${option.label} ${option.description}`}
              style={[
                styles.timeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? WORKOUT_ACCENT : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
                isSelected ? { backgroundColor: `${WORKOUT_ACCENT}20` } : {},
                isSelected && !isDark ? coloredShadow(WORKOUT_ACCENT, 'sm') : {},
              ]}
            >
              <Text style={styles.timeEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.timeLabel,
                  { color: isSelected ? WORKOUT_ACCENT : colors.foreground },
                  isSelected ? { fontWeight: typography.weight.bold } : {},
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.timeDescription, { color: colors.mutedForeground }]}>
                {option.description}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      {/* 그라디언트 CTA 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.nextButton,
            { overflow: 'hidden' },
            isValid && !isDark
              ? (Platform.select({
                  ios: {
                    shadowColor: WORKOUT_ACCENT,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }) ?? {})
              : {},
          ]}
          onPress={handleNext}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel="운동 타입 분석하기"
          accessibilityState={{ disabled: !isValid }}
        >
          <LinearGradient
            colors={isValid ? [WORKOUT_ACCENT, '#059669'] : [colors.muted, colors.muted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text
              style={[
                styles.nextButtonText,
                { color: isValid ? '#FFFFFF' : colors.mutedForeground },
              ]}
            >
              운동 타입 분석하기
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  heroContent: { alignItems: 'center', padding: spacing.xl },
  heroEmoji: { fontSize: 40, marginBottom: spacing.sm },
  heroTitle: { marginBottom: spacing.xs },
  heroSubtitle: { fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionDesc: { fontSize: 13, marginBottom: spacing.smx },
  frequencyList: { gap: spacing.smx },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  frequencyEmoji: { fontSize: 28, marginRight: spacing.smx },
  frequencyIconWrap: { width: 28, alignItems: 'center' as const, marginRight: spacing.smx },
  frequencyContent: { flex: 1 },
  frequencyLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  frequencyDescription: { fontSize: 13 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeCard: {
    width: '47%',
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  timeEmoji: { fontSize: 32, marginBottom: spacing.xs },
  timeLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  timeDescription: { fontSize: 13 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  nextButton: { borderRadius: radii.full },
  nextButtonGradient: { paddingVertical: spacing.md, alignItems: 'center' },
  nextButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
