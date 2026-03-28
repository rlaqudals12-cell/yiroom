/**
 * 온보딩 Step 2: 성별 / 스타일 선호 / 생년월일
 *
 * V5: 웹 구조 기반 — 성별 3지선다 + 스타일 3지선다 + 생년월일
 *     신장/체중/활동수준은 Step 3으로 이동
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  User,
  UserCircle,
  Users,
  Diamond,
  Heart,
  Zap,
  Sparkles,
  Shirt,
  Calendar,
  ChevronLeft,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingHero } from '../../components/onboarding';
import { GlassCard, StepProgressBar, Button, ScreenContainer } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import {
  useOnboarding,
  type Gender,
  type StylePreference,
  GENDER_LABELS,
  STYLE_PREFERENCE_LABELS,
  STYLE_PREFERENCE_DESCRIPTIONS,
  validateBirthYear,
} from '../../lib/onboarding';
import { useTheme, typography, radii, spacing } from '../../lib/theme';

// 온보딩 Step 2 히어로 색상 (violet-500 — 스타일 아이덴티티)
const STEP2_ACCENT = '#8B5CF6';

const GENDERS: Gender[] = ['male', 'female', 'neutral'];
const GENDER_ICONS: Record<Gender, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  male: User,
  female: UserCircle,
  neutral: Users,
};

const STYLES: StylePreference[] = ['masculine', 'feminine', 'unisex'];
const STYLE_ICONS: Record<StylePreference, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  masculine: Diamond,
  feminine: Heart,
  unisex: Zap,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingStep2() {
  const { colors, brand, spacing, radii, shadows } = useTheme();
  const { data, setBasicInfo, setStylePreference, nextStep, prevStep } = useOnboarding();

  const [birthYear, setBirthYear] = useState(data.basicInfo.birthYear?.toString() || '');
  const [birthYearError, setBirthYearError] = useState<string | null>(null);

  const handleGenderSelect = (gender: Gender): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBasicInfo({ gender });
    // neutral 선택 시 자동으로 unisex 스타일 설정 (웹과 동일)
    if (gender === 'neutral') {
      setStylePreference('unisex');
    }
  };

  const handleStyleSelect = (style: StylePreference): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStylePreference(style);
  };

  const handleBirthYearChange = (value: string): void => {
    setBirthYear(value);
    setBirthYearError(null);
    const year = parseInt(value, 10);

    // 4자리 입력 완료 시 검증
    if (value.length === 4) {
      const { valid, error } = validateBirthYear(year);
      if (valid) {
        setBasicInfo({ birthYear: year });
      } else {
        setBirthYearError(error ?? null);
      }
    }
  };

  const canProceed = data.basicInfo.gender && data.basicInfo.birthYear && !birthYearError;
  const showStyleSelection = data.basicInfo.gender && data.basicInfo.gender !== 'neutral';

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="onboarding-step2">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 미니 백 버튼 */}
        <Pressable
          onPress={prevStep}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
          testID="mini-back-button"
          accessibilityRole="button"
          accessibilityLabel="이전 단계로 돌아가기"
        >
          <ChevronLeft size={20} color={colors.foreground} strokeWidth={2} />
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>이전</Text>
        </Pressable>

        {/* 파스텔 히어로 헤더 */}
        <OnboardingHero
          icon={Sparkles}
          title="나에게 맞는 추천 받기"
          subtitle="성별과 스타일에 맞는 맞춤 분석을 제공해요"
          glowColor={STEP2_ACCENT}
          testID="onboarding-hero"
        />

        {/* 성별 선택 */}
        <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <User size={16} color={STEP2_ACCENT} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                성별
              </Text>
            </View>
            <View style={styles.optionRow}>
              {GENDERS.map((gender) => {
                const isSelected = data.basicInfo.gender === gender;
                return (
                  <Pressable
                    key={gender}
                    style={({ pressed }) => [
                      styles.optionButton,
                      {
                        backgroundColor: isSelected ? `${STEP2_ACCENT}18` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? STEP2_ACCENT : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...(isSelected
                          ? { ...shadows.md, shadowColor: STEP2_ACCENT, shadowOpacity: 0.18 }
                          : {}),
                      },
                    ]}
                    onPress={() => handleGenderSelect(gender)}
                    testID={`gender-${gender}`}
                    accessibilityRole="button"
                    accessibilityLabel={GENDER_LABELS[gender]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={{ marginBottom: spacing.xs }}>
                      {React.createElement(GENDER_ICONS[gender], {
                        size: 24,
                        color: isSelected ? STEP2_ACCENT : colors.mutedForeground,
                        strokeWidth: 2,
                      })}
                    </View>
                    <Text
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: isSelected ? typography.weight.bold : typography.weight.medium,
                        color: isSelected ? STEP2_ACCENT : colors.foreground,
                      }}
                    >
                      {GENDER_LABELS[gender]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* 스타일 선호 (neutral이 아닌 경우만 표시) */}
        {showStyleSelection && (
          <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.sectionTitleRow}>
                <Shirt size={16} color={STEP2_ACCENT} strokeWidth={2} />
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    marginLeft: 6,
                  }}
                >
                  스타일 선호
                </Text>
              </View>
              <View style={{ gap: spacing.sm }}>
                {STYLES.map((style) => {
                  const isSelected = data.stylePreference === style;
                  return (
                    <Pressable
                      key={style}
                      style={({ pressed }) => [
                        styles.styleButton,
                        {
                          backgroundColor: isSelected ? `${STEP2_ACCENT}18` : colors.card,
                          borderRadius: radii.xl,
                          borderColor: isSelected ? STEP2_ACCENT : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                          opacity: pressed ? 0.85 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          ...(isSelected
                            ? { ...shadows.md, shadowColor: STEP2_ACCENT, shadowOpacity: 0.18 }
                            : {}),
                        },
                      ]}
                      onPress={() => handleStyleSelect(style)}
                      testID={`style-${style}`}
                      accessibilityRole="button"
                      accessibilityLabel={STYLE_PREFERENCE_LABELS[style]}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={{ marginRight: spacing.sm }}>
                        {React.createElement(STYLE_ICONS[style], {
                          size: 20,
                          color: isSelected ? STEP2_ACCENT : colors.mutedForeground,
                          strokeWidth: 2,
                        })}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: typography.size.sm,
                            fontWeight: isSelected
                              ? typography.weight.bold
                              : typography.weight.medium,
                            color: isSelected ? STEP2_ACCENT : colors.foreground,
                          }}
                        >
                          {STYLE_PREFERENCE_LABELS[style]}
                        </Text>
                        <Text
                          style={{
                            fontSize: typography.size.xs,
                            color: colors.mutedForeground,
                            marginTop: 2,
                          }}
                        >
                          {STYLE_PREFERENCE_DESCRIPTIONS[style]}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* 생년월일 */}
        <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Calendar size={16} color={STEP2_ACCENT} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                출생년도
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                padding: spacing.md,
                color: colors.foreground,
                fontSize: typography.size.base,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={birthYear}
              onChangeText={handleBirthYearChange}
              placeholder="1990"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={4}
              testID="birthYear-input"
              accessibilityLabel="출생년도"
            />
            {birthYear.length === 4 && birthYearError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 4 }}>
                <AlertCircle size={14} color="#EF4444" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: '#EF4444',
                  }}
                  testID="birthYear-error"
                >
                  {birthYearError}
                </Text>
              </View>
            )}
            {birthYear.length === 4 && !birthYearError && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: spacing.xs,
                }}
              >
                만 {CURRENT_YEAR - parseInt(birthYear, 10)}세
              </Text>
            )}
          </View>
        </Animated.View>

        {/* 입력 현황 */}
        {data.basicInfo.gender && (
          <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ marginBottom: spacing.md }}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                입력 현황
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs + 1,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {[
                  data.basicInfo.gender ? `성별: ${GENDER_LABELS[data.basicInfo.gender]}` : null,
                  data.stylePreference
                    ? `스타일: ${STYLE_PREFERENCE_LABELS[data.stylePreference]}`
                    : null,
                  data.basicInfo.birthYear ? `출생: ${data.basicInfo.birthYear}년` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* 진행 표시 */}
        <View style={{ marginTop: spacing.xl }}>
          <StepProgressBar
            current={2}
            total={3}
            accentColor={STEP2_ACCENT}
            testID="step-progress"
          />
        </View>
      </ScrollView>

      {/* 푸터 */}
      <View style={styles.footerWrap}>
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.footerFade}
          pointerEvents="none"
        />
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: 40,
              paddingTop: spacing.md,
              gap: spacing.sm + 4,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Button
            variant="secondary"
            size="lg"
            onPress={prevStep}
            testID="back-button"
            style={{ flex: 1 }}
          >
            이전
          </Button>
          <Pressable
            onPress={nextStep}
            disabled={!canProceed}
            style={({ pressed }) => [
              shadows.md,
              {
                flex: 2,
                borderRadius: radii.full,
                overflow: 'hidden',
                opacity: !canProceed ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="next-button"
            accessibilityRole="button"
            accessibilityLabel="다음"
            accessibilityState={{ disabled: !canProceed }}
          >
            <LinearGradient
              colors={
                canProceed ? ['#EC4899', '#A855F7'] : [colors.secondary, colors.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                style={{
                  color: canProceed ? brand.primaryForeground : colors.mutedForeground,
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                }}
              >
                다음
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.mlg,
    paddingBottom: 140,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.smx,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.smx,
  },
  optionButton: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerFade: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
  },
});
