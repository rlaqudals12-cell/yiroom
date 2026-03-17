/**
 * 온보딩 Step 1: 관심 분석 선택
 *
 * V5: 뷰티 AI 분석 중심 전환 — 6종 분석 모듈 선택
 *     "어떤 분석이 궁금하세요?" (복수 선택 가능)
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Sparkles, Ruler, Scissors, Brush, FlaskConical, Check } from 'lucide-react-native';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingHero } from '../../components/onboarding';
import { GlassCard, StepProgressBar, ScreenContainer } from '../../components/ui';
import { TIMING, staggeredEntry } from '../../lib/animations';
import {
  useOnboarding,
  type AnalysisInterest,
  ANALYSIS_LABELS,
  ANALYSIS_DESCRIPTIONS,
  ANALYSIS_COLORS,
} from '../../lib/onboarding';
import { useTheme, radii, spacing } from '../../lib/theme';

// 온보딩 Step 1 히어로 색상 (pink-500 — 뷰티 아이덴티티)
const STEP1_ACCENT = '#EC4899';

// Lucide 아이콘 매핑
const ANALYSIS_ICON_MAP: Record<AnalysisInterest, typeof Palette> = {
  personal_color: Palette,
  skin: Sparkles,
  body: Ruler,
  hair: Scissors,
  makeup: Brush,
  ingredients: FlaskConical,
};

const ANALYSES: AnalysisInterest[] = [
  'personal_color',
  'skin',
  'body',
  'hair',
  'makeup',
  'ingredients',
];

export default function OnboardingStep1() {
  const { colors, brand, spacing, radii, shadows, typography } = useTheme();
  const { data, toggleAnalysisInterest, nextStep } = useOnboarding();

  const interests = data.analysisInterests ?? [];
  const canProceed = interests.length > 0;

  const handleToggle = (analysis: AnalysisInterest): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleAnalysisInterest(analysis);
  };

  return (
    <ScreenContainer
      scrollable={false}
      contentPadding={0}
      testID="onboarding-step1"
      backgroundGradient="home"
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 파스텔 히어로 헤더 */}
        <OnboardingHero
          emoji="✨"
          title="어떤 분석이 궁금하세요?"
          subtitle={'온전한 나를 찾는 여정을 시작해요\n(복수 선택 가능)'}
          glowColor={STEP1_ACCENT}
          testID="onboarding-hero"
        />

        {/* 분석 선택 카드 */}
        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {ANALYSES.map((analysis, index) => {
            const isSelected = interests.includes(analysis);
            const IconComponent = ANALYSIS_ICON_MAP[analysis];
            const analysisColor = ANALYSIS_COLORS[analysis];

            return (
              <Animated.View key={analysis} entering={staggeredEntry(index, 80)}>
                <Pressable
                  style={({ pressed }) => [
                    styles.goalCard,
                    {
                      backgroundColor: isSelected
                        ? `${analysisColor.gradient[0]}30`
                        : `${colors.card}CC`,
                      borderRadius: radii.xl,
                      borderColor: isSelected
                        ? analysisColor.gradient[1]
                        : `${colors.border}80`,
                      borderWidth: isSelected ? 2 : 1,
                      padding: spacing.md,
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      ...(isSelected
                        ? {
                            ...shadows.md,
                            shadowColor: analysisColor.gradient[1],
                            shadowOpacity: 0.25,
                          }
                        : {}),
                    },
                  ]}
                  onPress={() => handleToggle(analysis)}
                  testID={`analysis-${analysis}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${ANALYSIS_LABELS[analysis]}, ${ANALYSIS_DESCRIPTIONS[analysis]}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {/* 그라디언트 아이콘 박스 */}
                  {isSelected ? (
                    <LinearGradient
                      colors={analysisColor.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconBox}
                    >
                      <IconComponent
                        size={24}
                        color={colors.overlayForeground}
                        strokeWidth={2}
                      />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: analysisColor.bg }]}>
                      <IconComponent
                        size={24}
                        color={analysisColor.gradient[0]}
                        strokeWidth={2}
                      />
                    </View>
                  )}

                  {/* 텍스트 영역 */}
                  <View style={styles.goalTextWrap}>
                    <Text
                      style={{
                        color: isSelected
                          ? analysisColor.gradient[0]
                          : colors.foreground,
                        fontSize: typography.size.base,
                        fontWeight: isSelected
                          ? typography.weight.bold
                          : typography.weight.semibold,
                      }}
                    >
                      {ANALYSIS_LABELS[analysis]}
                    </Text>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: typography.size.xs + 1,
                        marginTop: spacing.xxs,
                      }}
                      numberOfLines={1}
                    >
                      {ANALYSIS_DESCRIPTIONS[analysis]}
                    </Text>
                  </View>

                  {/* 체크마크 */}
                  {isSelected && (
                    <LinearGradient colors={analysisColor.gradient} style={styles.checkmark}>
                      <Check size={14} color={colors.overlayForeground} strokeWidth={3} />
                    </LinearGradient>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* 선택 현황 요약 */}
        {interests.length > 0 && (
          <Animated.View entering={FadeInUp.delay(500).duration(TIMING.normal)}>
            <GlassCard shadowSize="md" style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                관심 분석 ({interests.length}개)
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs + 1,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {interests.map((a) => ANALYSIS_LABELS[a]).join(' · ')}
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* 운동/영양 관심 링크 */}
        <Animated.View entering={FadeInUp.delay(550).duration(TIMING.normal)}>
          <Pressable
            style={{ marginTop: spacing.md, alignItems: 'center' }}
            onPress={nextStep}
            testID="wellness-skip-link"
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: typography.size.xs + 1,
              }}
            >
              운동/영양도 관심 있어요 →
            </Text>
          </Pressable>
        </Animated.View>

        {/* 진행 표시 */}
        <Animated.View entering={FadeInUp.delay(600).duration(TIMING.normal)}>
          <View style={{ marginTop: spacing.xl }}>
            <StepProgressBar
              current={1}
              total={3}
              accentColor={STEP1_ACCENT}
              testID="step-progress"
            />
          </View>
        </Animated.View>
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
              backgroundColor: colors.background,
            },
          ]}
        >
          <Pressable
            onPress={nextStep}
            disabled={!canProceed}
            style={({ pressed }) => [
              shadows.md,
              {
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
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  goalTextWrap: {
    flex: 1,
  },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {},
});
