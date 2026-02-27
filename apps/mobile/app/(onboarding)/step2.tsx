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
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
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
import { useTheme, typography} from '../../lib/theme';

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
          <View
            style={[
              styles.heroHeader,
              { backgroundColor: isDark ? STEP2_HERO_BG_DARK : STEP2_HERO_BG_LIGHT, borderRadius: radii.xl + 8 },
            ]}
          >
            <View style={[styles.heroIconWrap, { backgroundColor: STEP2_ACCENT }]}>
              <ClipboardList size={36} color={colors.overlayForeground} strokeWidth={2} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              기본 정보를 알려주세요
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
              더 정확한 맞춤 추천을 위해 필요해요
            </Text>
          </View>
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
                        backgroundColor: isSelected ? `${brand.primary}14` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: 2,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
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
                        borderRadius: radii.lg + 2,
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
                        borderRadius: radii.lg + 2,
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
                        backgroundColor: isSelected ? `${brand.primary}14` : colors.card,
                        borderRadius: radii.xl,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderWidth: 2,
                        opacity: pressed ? 0.85 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
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
                backgroundColor: canProceed ? brand.primary : colors.secondary,
                borderRadius: radii.full,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canProceed ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            testID="next-button"
            accessibilityRole="button"
            accessibilityLabel="다음"
            accessibilityState={{ disabled: !canProceed }}
          >
            <Text
              style={{
                color: canProceed ? brand.primaryForeground : colors.mutedForeground,
                fontSize: 16,
                fontWeight: typography.weight.bold,
              }}
            >
              다음
            </Text>
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
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.secondary,
          borderRadius: radii.lg + 2,
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
    padding: 20,
    paddingBottom: 140,
  },
  // 미니 백 버튼
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  // 히어로 (웹 파스텔 패턴)
  heroHeader: {
    padding: 32,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
