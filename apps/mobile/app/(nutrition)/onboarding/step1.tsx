/**
 * N-1 영양 온보딩 Step 1 — 기본 정보 입력
 * 목표/성별/나이/키/체중/활동수준
 * 운동 온보딩 goals.tsx 패턴 복제
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

const NUTRITION_ACCENT = '#F97316';

const GOALS = [
  { id: 'weight_loss', label: '체중 감량', emoji: '🔥' },
  { id: 'muscle_gain', label: '근육 증가', emoji: '💪' },
  { id: 'health', label: '건강 유지', emoji: '❤️' },
  { id: 'energy', label: '활력 증진', emoji: '⚡' },
];

const GENDERS = [
  { id: 'male', label: '남성', emoji: '👨' },
  { id: 'female', label: '여성', emoji: '👩' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '좌식 생활', description: '거의 운동하지 않음' },
  { id: 'light', label: '가벼운 활동', description: '주 1-3회 운동' },
  { id: 'moderate', label: '보통 활동', description: '주 3-5회 운동' },
  { id: 'active', label: '활동적', description: '주 6-7회 운동' },
  { id: 'very_active', label: '매우 활동적', description: '매일 격렬한 운동' },
];

export default function NutritionStep1Screen() {
  const { colors, brand, isDark } = useTheme();
  const [goal, setGoal] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  const isValid = goal && gender && age && heightCm && weightKg && activityLevel;

  const handleNext = (): void => {
    router.push({
      pathname: '/(nutrition)/onboarding/step2',
      params: {
        goal,
        gender,
        age,
        heightCm,
        weightKg,
        activityLevel,
      },
    });
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="nutrition-onboarding-step1"
    >
      {/* 목표 선택 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>영양 목표</Text>
        <View style={styles.chipRow}>
          {GOALS.map((g) => (
            <Pressable
              key={g.id}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.card,
                  borderColor: goal === g.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                goal === g.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setGoal(g.id)}
            >
              <Text style={styles.chipEmoji}>{g.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: goal === g.id ? NUTRITION_ACCENT : colors.foreground },
                ]}
              >
                {g.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 성별 선택 */}
      <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>성별</Text>
        <View style={[styles.chipRow, { gap: spacing.smx }]}>
          {GENDERS.map((g) => (
            <Pressable
              key={g.id}
              style={[
                styles.genderChip,
                {
                  backgroundColor: colors.card,
                  borderColor: gender === g.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                gender === g.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setGender(g.id)}
            >
              <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: gender === g.id ? NUTRITION_ACCENT : colors.foreground },
                ]}
              >
                {g.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 나이/키/체중 입력 */}
      <Animated.View entering={FadeInUp.delay(160).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>신체 정보</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>나이</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={colors.mutedForeground}
              maxLength={3}
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>세</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>키</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="number-pad"
              placeholder="170"
              placeholderTextColor={colors.mutedForeground}
              maxLength={3}
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>cm</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>체중</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="65"
              placeholderTextColor={colors.mutedForeground}
              maxLength={5}
            />
            <Text style={[styles.inputUnit, { color: colors.mutedForeground }]}>kg</Text>
          </View>
        </View>
      </Animated.View>

      {/* 활동 수준 */}
      <Animated.View entering={FadeInUp.delay(240).duration(TIMING.normal)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>활동 수준</Text>
        <View style={{ gap: spacing.sm }}>
          {ACTIVITY_LEVELS.map((level) => (
            <Pressable
              key={level.id}
              style={[
                styles.activityCard,
                {
                  backgroundColor: colors.card,
                  borderColor: activityLevel === level.id ? NUTRITION_ACCENT : colors.border,
                  borderWidth: 1,
                },
                activityLevel === level.id && { backgroundColor: `${NUTRITION_ACCENT}15` },
              ]}
              onPress={() => setActivityLevel(level.id)}
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
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* 다음 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: isValid ? NUTRITION_ACCENT : colors.muted },
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
        >
          <Text
            style={[styles.nextButtonText, { color: isValid ? '#FFFFFF' : colors.mutedForeground }]}
          >
            다음
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
    marginTop: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smx,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  chipEmoji: { fontSize: 18 },
  chipLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.smx,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingVertical: spacing.smx,
    textAlign: 'center',
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
  },
  inputUnit: {
    fontSize: typography.size.xs,
    marginTop: spacing.xxs,
  },
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
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
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
