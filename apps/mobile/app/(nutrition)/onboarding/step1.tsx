/**
 * N-1 영양 온보딩 Step 1 — 기본 정보 입력
 * 목표/성별/나이/키/체중/활동수준
 * UX v3: GlassCard + GradientText 히어로 + 배경 그라디언트 + coloredShadow + a11y
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Dumbbell, Flame, HeartPulse, User, UserCircle, Zap } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DisclaimerCard } from '@/components/onboarding';
import {
  GlassCard,
  GradientText,
  ScalePressable,
  ScreenContainer,
  StepProgressBar,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii, coloredShadow } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

const GOALS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'weight_loss', label: '체중 감량', icon: Flame },
  { id: 'muscle_gain', label: '근육 증가', icon: Dumbbell },
  { id: 'health', label: '건강 유지', icon: HeartPulse },
  { id: 'energy', label: '활력 증진', icon: Zap },
];

const GENDERS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'male', label: '남성', icon: User },
  { id: 'female', label: '여성', icon: UserCircle },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '좌식 생활', description: '거의 운동하지 않음' },
  { id: 'light', label: '가벼운 활동', description: '주 1-3회 운동' },
  { id: 'moderate', label: '보통 활동', description: '주 3-5회 운동' },
  { id: 'active', label: '활동적', description: '주 6-7회 운동' },
  { id: 'very_active', label: '매우 활동적', description: '매일 격렬한 운동' },
];

export default function NutritionStep1Screen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const [goal, setGoal] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  const [ageError, setAgeError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleAgeChange = (value: string): void => {
    setAge(value);
    const num = parseInt(value, 10);
    if (value && (isNaN(num) || num < 1 || num > 120)) {
      setAgeError('1~120 사이의 나이를 입력해주세요');
    } else {
      setAgeError('');
    }
  };

  const handleHeightChange = (value: string): void => {
    setHeightCm(value);
    const num = parseInt(value, 10);
    if (value && (isNaN(num) || num < 100 || num > 250)) {
      setHeightError('100~250 사이의 키를 입력해주세요');
    } else {
      setHeightError('');
    }
  };

  const handleWeightChange = (value: string): void => {
    setWeightKg(value);
    const num = parseFloat(value);
    if (value && (isNaN(num) || num < 20 || num > 300)) {
      setWeightError('20~300 사이의 체중을 입력해주세요');
    } else {
      setWeightError('');
    }
  };

  const isValid =
    goal &&
    gender &&
    age &&
    heightCm &&
    weightKg &&
    activityLevel &&
    !ageError &&
    !heightError &&
    !weightError;

  const handleNext = (): void => {
    router.push({
      pathname: '/(nutrition)/onboarding/step2',
      params: { goal, gender, age, heightCm, weightKg, activityLevel },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="nutrition"
      testID="nutrition-onboarding-step1"
    >
      {/* 글래스모피즘 히어로 헤더 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="lg" glowColor={NUTRITION_ACCENT} style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🍊</Text>
            <GradientText
              variant="extended"
              fontSize={22}
              fontWeight="700"
              style={styles.heroTitle}
            >
              맞춤 영양 플랜
            </GradientText>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              기본 정보를 입력하면 나만의 영양 플랜을 만들어 드려요
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* 스텝 프로그레스 바 */}
      <StepProgressBar
        current={1}
        total={3}
        accentColor={NUTRITION_ACCENT}
        testID="step-progress"
      />

      <DisclaimerCard
        message="본 서비스는 전문 의료 조언을 대체하지 않아요. 특정 질환이 있거나 임신 중인 경우 전문가와 상담 후 이용해 주세요."
        testID="nutrition-disclaimer"
      />

      {/* 목표 선택 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>영양 목표</Text>
        <View style={styles.chipRow}>
          {GOALS.map((g) => (
            <ScalePressable
              key={g.id}
              selected={goal === g.id}
              onPress={() => setGoal(g.id)}
              accessibilityLabel={`${g.label} 목표 선택`}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.card,
                  borderColor: goal === g.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: goal === g.id ? 2 : 1,
                },
                goal === g.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                goal === g.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <g.icon
                size={18}
                color={goal === g.id ? NUTRITION_ACCENT : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: goal === g.id ? NUTRITION_ACCENT : colors.foreground },
                  goal === g.id && { fontWeight: typography.weight.bold },
                ]}
              >
                {g.label}
              </Text>
              {goal === g.id && (
                <Text style={{ fontSize: 12, color: NUTRITION_ACCENT, fontWeight: '700' }}>✓</Text>
              )}
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 성별 선택 */}
      <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>성별</Text>
        <View style={[styles.chipRow, { gap: spacing.smx }]}>
          {GENDERS.map((g) => (
            <ScalePressable
              key={g.id}
              selected={gender === g.id}
              onPress={() => setGender(g.id)}
              accessibilityLabel={`${g.label} 선택`}
              style={[
                styles.genderChip,
                {
                  backgroundColor: colors.card,
                  borderColor: gender === g.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: gender === g.id ? 2 : 1,
                },
                gender === g.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                gender === g.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <g.icon
                size={24}
                color={gender === g.id ? NUTRITION_ACCENT : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: gender === g.id ? NUTRITION_ACCENT : colors.foreground },
                  gender === g.id && { fontWeight: typography.weight.bold },
                ]}
              >
                {g.label}
              </Text>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

      {/* 나이/키/체중 입력 */}
      <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>신체 정보</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>나이</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    focusedField === 'age'
                      ? NUTRITION_ACCENT
                      : ageError
                        ? '#EF4444'
                        : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={age}
              onChangeText={handleAgeChange}
              onFocus={() => setFocusedField('age')}
              onBlur={() => setFocusedField(null)}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={colors.mutedForeground}
              maxLength={3}
              accessibilityLabel="나이 입력"
              accessibilityHint="만 나이를 숫자로 입력해주세요"
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>세</Text>
            {ageError ? (
              <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{ageError}</Text>
            ) : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>키</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    focusedField === 'height'
                      ? NUTRITION_ACCENT
                      : heightError
                        ? '#EF4444'
                        : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={heightCm}
              onChangeText={handleHeightChange}
              onFocus={() => setFocusedField('height')}
              onBlur={() => setFocusedField(null)}
              keyboardType="number-pad"
              placeholder="170"
              placeholderTextColor={colors.mutedForeground}
              maxLength={3}
              accessibilityLabel="키 입력"
              accessibilityHint="센티미터 단위로 입력해주세요"
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>cm</Text>
            {heightError ? (
              <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{heightError}</Text>
            ) : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>체중</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    focusedField === 'weight'
                      ? NUTRITION_ACCENT
                      : weightError
                        ? '#EF4444'
                        : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={weightKg}
              onChangeText={handleWeightChange}
              onFocus={() => setFocusedField('weight')}
              onBlur={() => setFocusedField(null)}
              keyboardType="decimal-pad"
              placeholder="65"
              placeholderTextColor={colors.mutedForeground}
              maxLength={5}
              accessibilityLabel="체중 입력"
              accessibilityHint="킬로그램 단위로 입력해주세요"
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>kg</Text>
            {weightError ? (
              <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{weightError}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {/* 활동 수준 */}
      <Animated.View entering={FadeInUp.delay(320).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>활동 수준</Text>
        <View style={{ gap: spacing.sm }}>
          {ACTIVITY_LEVELS.map((level) => (
            <ScalePressable
              key={level.id}
              selected={activityLevel === level.id}
              onPress={() => setActivityLevel(level.id)}
              accessibilityLabel={`${level.label}: ${level.description}`}
              style={[
                styles.activityCard,
                {
                  backgroundColor: colors.card,
                  borderColor: activityLevel === level.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: activityLevel === level.id ? 2 : 1,
                },
                activityLevel === level.id ? { backgroundColor: `${NUTRITION_ACCENT}20` } : {},
                activityLevel === level.id && !isDark ? coloredShadow(NUTRITION_ACCENT, 'sm') : {},
              ]}
            >
              <View style={styles.activityContent}>
                <Text
                  style={[
                    styles.activityLabel,
                    { color: activityLevel === level.id ? NUTRITION_ACCENT : colors.foreground },
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={[styles.activityDesc, { color: colors.mutedForeground }]}>
                  {level.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  { borderColor: activityLevel === level.id ? NUTRITION_ACCENT : colors.border },
                ]}
              >
                {activityLevel === level.id && (
                  <View style={[styles.radioInner, { backgroundColor: NUTRITION_ACCENT }]} />
                )}
              </View>
            </ScalePressable>
          ))}
        </View>
      </Animated.View>

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
                    shadowColor: NUTRITION_ACCENT,
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
          accessibilityLabel="다음 단계로 이동"
          accessibilityState={{ disabled: !isValid }}
        >
          <LinearGradient
            colors={isValid ? [NUTRITION_ACCENT, '#EA580C'] : [colors.muted, colors.muted]}
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
              다음
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: spacing.md,
  },
  heroContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  heroEmoji: { fontSize: 40, marginBottom: spacing.sm },
  heroTitle: {
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
    marginTop: spacing.lg,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  chipLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xs,
  },
  inputRow: { flexDirection: 'row', gap: spacing.smx },
  inputGroup: { flex: 1, alignItems: 'center' },
  inputLabel: { fontSize: typography.size.xs, marginBottom: spacing.xs },
  input: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing.smx,
    textAlign: 'center',
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
  },
  inputUnit: { fontSize: typography.size.xs, marginTop: spacing.xxs },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  activityContent: { flex: 1 },
  activityLabel: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  activityDesc: { fontSize: 13 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
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
  nextButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
