/**
 * 온보딩 Step 2: 기본 정보 입력
 *
 * V4: 웹-모바일 시각 통일 — 파스텔 히어로 + 단색 CTA +
 *     border-2 카드 + 도트 ProgressIndicator
 */

import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ClipboardList,
  User,
  Ruler,
  Activity,
  ChevronLeft,
  Sofa,
  Footprints,
  Bike,
  Flame,
  Zap,
} from 'lucide-react-native';
import { Platform, View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { GlassCard, ProgressIndicator, Button, ScreenContainer } from '../../components/ui';
import { TIMING } from '../../lib/animations';
import {
  useOnboarding,
  type Gender,
  type ActivityLevel,
  GENDER_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from '../../lib/onboarding';
import { useTheme, typography, radii , spacing } from '../../lib/theme';

// 온보딩 Step 2 히어로 색상 (blue-500 계열 — 기본 정보 아이덴티티)
const STEP2_ACCENT = '#3B82F6';
const STEP2_HERO_BG_LIGHT = '#EFF6FF';
const STEP2_HERO_BG_DARK = `${STEP2_ACCENT}15`;

const GENDERS: Gender[] = ['male', 'female', 'other'];
const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

// 활동 수준 아이콘 매핑
const ACTIVITY_ICON_MAP: Record<ActivityLevel, typeof Sofa> = {
  sedentary: Sofa,
  light: Footprints,
  moderate: Bike,
  active: Flame,
  very_active: Zap,
};

const CURRENT_YEAR = new Date().getFullYear();

export default function OnboardingStep2() {
  const { colors, brand, spacing, radii, shadows, isDark } = useTheme();
  const { data, setBasicInfo, nextStep, prevStep } = useOnboarding();

  const [birthYear, setBirthYear] = useState(data.basicInfo.birthYear?.toString() || '');
  const [height, setHeight] = useState(data.basicInfo.height?.toString() || '');
  const [weight, setWeight] = useState(data.basicInfo.weight?.toString() || '');

  const handleGenderSelect = (gender: Gender): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBasicInfo({ gender });
  };

  const handleActivitySelect = (level: ActivityLevel): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBasicInfo({ activityLevel: level });
  };

  const handleBirthYearChange = (value: string): void => {
    setBirthYear(value);
    const year = parseInt(value, 10);
    if (year >= 1900 && year <= CURRENT_YEAR) {
      setBasicInfo({ birthYear: year });
    }
  };

  const handleHeightChange = (value: string): void => {
    setHeight(value);
    const h = parseInt(value, 10);
    if (h > 0 && h < 300) {
      setBasicInfo({ height: h });
    }
  };

  const handleWeightChange = (value: string): void => {
    setWeight(value);
    const w = parseFloat(value);
    if (w > 0 && w < 500) {
      setBasicInfo({ weight: w });
    }
  };

  const canProceed =
    data.basicInfo.gender && data.basicInfo.birthYear && data.basicInfo.activityLevel;

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="onboarding-step2">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 미니 백 버튼 */}
        <Pressable
          onPress={prevStep}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          testID="mini-back-button"
          accessibilityRole="button"
          accessibilityLabel="이전 단계로 돌아가기"
        >
          <ChevronLeft size={20} color={colors.foreground} strokeWidth={2} />
          <Text style={{ color: colors.foreground, fontSize: typography.size.sm }}>이전</Text>
        </Pressable>

        {/* 파스텔 히어로 헤더 (웹 온보딩 슬라이드와 동일 패턴) */}
        <Animated.View entering={FadeIn.duration(TIMING.slow)}>
          <LinearGradient
            colors={isDark
              ? [`${STEP2_ACCENT}10`, `${STEP2_ACCENT}18`]
              : [STEP2_HERO_BG_LIGHT, '#DBEAFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroHeader,
              {
                borderRadius: radii.xl + 8,
                borderWidth: 1,
                borderColor: isDark ? `${STEP2_ACCENT}20` : `${STEP2_ACCENT}15`,
                ...(isDark ? {} : Platform.select({
                  ios: { shadowColor: STEP2_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
                  android: { elevation: 2 },
                }) ?? {}),
              },
            ]}
          >
            <View style={[
              styles.heroIconWrap,
              {
                backgroundColor: STEP2_ACCENT,
                ...(Platform.select({
                  ios: { shadowColor: STEP2_ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                  android: { elevation: 6 },
                }) ?? {}),
              },
            ]}>
              <ClipboardList size={36} color={colors.overlayForeground} strokeWidth={2} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              기본 정보를 알려주세요
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              더 정확한 맞춤 추천을 위해 필요해요
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* 성별 선택 */}
        <Animated.View entering={FadeInUp.delay(150).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <User size={16} color={brand.primary} strokeWidth={2} />
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
                        backgroundColor: isSelected ? `${brand.primary}18` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...(isSelected ? { ...shadows.md, shadowColor: brand.primary, shadowOpacity: 0.18 } : shadows.card),
                      },
                    ]}
                    onPress={() => handleGenderSelect(gender)}
                    testID={`gender-${gender}`}
                    accessibilityRole="button"
                    accessibilityLabel={GENDER_LABELS[gender]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.medium,
                        color: isSelected ? brand.primary : colors.foreground,
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

        {/* 출생년도 */}
        <Animated.View entering={FadeInUp.delay(250).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <Input
              label="출생년도"
              value={birthYear}
              onChangeText={handleBirthYearChange}
              placeholder="1990"
              keyboardType="number-pad"
              maxLength={4}
              testID="birthYear-input"
            />
          </View>
        </Animated.View>

        {/* 신장/체중 (선택) */}
        <Animated.View entering={FadeInUp.delay(350).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Ruler size={16} color={brand.primary} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                신장 / 체중 (선택)
              </Text>
            </View>
            <GlassCard intensity={25} style={{ padding: spacing.md }}>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.secondary,
                        borderRadius: radii.xl,
                        color: colors.foreground,
                        fontSize: typography.size.base,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    value={height}
                    onChangeText={handleHeightChange}
                    placeholder="170"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={3}
                    testID="height-input"
                    accessibilityLabel="키 입력, cm"
                  />
                  <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                    cm
                  </Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={[
                      styles.customInput,
                      {
                        backgroundColor: colors.secondary,
                        borderRadius: radii.xl,
                        color: colors.foreground,
                        fontSize: typography.size.base,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    value={weight}
                    onChangeText={handleWeightChange}
                    placeholder="65"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    testID="weight-input"
                    accessibilityLabel="체중 입력, kg"
                  />
                  <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>
                    kg
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* 활동 수준 (아이콘 포함) */}
        <Animated.View entering={FadeInUp.delay(450).duration(TIMING.normal)}>
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionTitleRow}>
              <Activity size={16} color={brand.primary} strokeWidth={2} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  marginLeft: 6,
                }}
              >
                평소 활동 수준
              </Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              {ACTIVITY_LEVELS.map((level) => {
                const isSelected = data.basicInfo.activityLevel === level;
                const IconComponent = ACTIVITY_ICON_MAP[level];
                return (
                  <Pressable
                    key={level}
                    style={({ pressed }) => [
                      styles.activityButton,
                      {
                        backgroundColor: isSelected ? `${brand.primary}18` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        ...(isSelected ? { ...shadows.md, shadowColor: brand.primary, shadowOpacity: 0.18 } : shadows.card),
                      },
                    ]}
                    onPress={() => handleActivitySelect(level)}
                    testID={`activity-${level}`}
                    accessibilityRole="button"
                    accessibilityLabel={ACTIVITY_LEVEL_LABELS[level]}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.activityIconBox,
                        {
                          backgroundColor: isSelected
                            ? `${brand.primary}20`
                            : colors.secondary,
                        },
                      ]}
                    >
                      <IconComponent
                        size={20}
                        color={isSelected ? brand.primary : colors.mutedForeground}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: typography.size.sm,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.medium,
                        color: isSelected ? brand.primary : colors.foreground,
                      }}
                    >
                      {ACTIVITY_LEVEL_LABELS[level]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* 선택 현황 (웹 동일 패턴 — blue-50 selection status) */}
        {(data.basicInfo.gender || data.basicInfo.activityLevel) && (
          <Animated.View entering={FadeInUp.delay(500).duration(TIMING.normal)}>
            <View
              style={{
                backgroundColor: `${STEP2_ACCENT}10`,
                borderRadius: radii.xl,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: `${STEP2_ACCENT}20`,
                ...shadows.sm,
              }}
            >
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
                  data.basicInfo.birthYear ? `출생: ${data.basicInfo.birthYear}년` : null,
                  data.basicInfo.activityLevel
                    ? `활동: ${ACTIVITY_LEVEL_LABELS[data.basicInfo.activityLevel]}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* 진행 표시 */}
        <ProgressIndicator current={2} total={3} style={{ marginTop: spacing.xl }} />
      </ScrollView>

      {/* 푸터 페이드 + 그라디언트 CTA */}
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
              colors={canProceed ? [brand.primary, '#7C3AED'] : [colors.secondary, colors.secondary]}
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

// Input 래퍼 (기존 barrel 사용 대신 로컬 정의 — 출생년도 전용)
function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType: 'number-pad' | 'decimal-pad';
  maxLength: number;
  testID: string;
}): React.JSX.Element {
  const { colors, radii, spacing } = useTheme();
  return (
    <View>
      <Text
        style={{
          color: colors.foreground,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          marginBottom: spacing.sm,
        }}
      >
        {label}
      </Text>
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
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        maxLength={maxLength}
        testID={testID}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.mlg,
    paddingBottom: 140,
  },
  // 미니 백 버튼
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.smx,
    alignSelf: 'flex-start',
  },
  // 히어로 (웹 파스텔 패턴)
  heroHeader: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.size.sm,
    textAlign: 'center',
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
  customInput: {
    flex: 1,
    padding: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smx,
  },
  // 푸터
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
