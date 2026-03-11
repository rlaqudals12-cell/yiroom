/**
 * N-1 영양 온보딩 — 시작 화면
 * 운동 온보딩 패턴 복제 + 영양 도메인 적용
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { ScreenContainer, GlassCard } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, radii, spacing } from '@/lib/theme';

// 영양 모듈 악센트 (orange 계열)
const NUTRITION_ACCENT = '#F97316';
const NUTRITION_HERO_BG_LIGHT = '#FFF7ED';

export default function NutritionOnboardingScreen() {
  const { colors, brand, isDark } = useTheme();

  const handleStart = (): void => {
    router.push('/(nutrition)/onboarding/step1');
  };

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      testID="nutrition-onboarding-screen"
      backgroundGradient="nutrition"
    >
      {/* 히어로 헤더 */}
      <Animated.View entering={FadeIn.duration(TIMING.normal)}>
        <LinearGradient
          colors={
            isDark
              ? [`${NUTRITION_ACCENT}10`, `${NUTRITION_ACCENT}18`]
              : [NUTRITION_HERO_BG_LIGHT, '#FFEDD5']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { borderRadius: radii.xl, padding: spacing.lg }]}
        >
          <View
            style={[
              styles.iconContainer,
              !isDark
                ? (Platform.select({
                    ios: {
                      shadowColor: NUTRITION_ACCENT,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                    },
                    android: { elevation: 4 },
                  }) ?? {})
                : {},
            ]}
          >
            <LinearGradient
              colors={['#FB923C', NUTRITION_ACCENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Text style={{ fontSize: 32 }}>🥗</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>맞춤 영양 플랜</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            목표와 체질에 맞는{'\n'}나만의 영양 가이드를 만들어보세요
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* 특징 카드 */}
      <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ marginBottom: spacing.md }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>이룸 영양의 특징</Text>
          <View style={styles.featureList}>
            <FeatureItem emoji="🔬" title="BMR/TDEE 계산" description="Mifflin-St Jeor 공식 기반" />
            <FeatureItem emoji="📊" title="매크로 분석" description="탄수화물, 단백질, 지방 비율" />
            <FeatureItem
              emoji="💊"
              title="영양제 추천"
              description="부족한 영양소 기반 맞춤 추천"
            />
            <FeatureItem emoji="🍽️" title="식단 기록" description="AI 사진 인식 + 바코드 스캔" />
          </View>
        </GlassCard>
      </Animated.View>

      {/* 온보딩 단계 */}
      <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ marginBottom: spacing.md }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>온보딩 과정 (3단계)</Text>
          <View style={styles.stepList}>
            <StepItem number={1} title="기본 정보 입력" />
            <StepItem number={2} title="식사 스타일 선택" />
            <StepItem number={3} title="알레르기 & 칼로리 미리보기" />
          </View>
        </GlassCard>
      </Animated.View>

      {/* 시작 버튼 */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.startButton,
            { overflow: 'hidden' },
            !isDark
              ? (Platform.select({
                  ios: {
                    shadowColor: brand.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }) ?? {})
              : {},
          ]}
          onPress={handleStart}
        >
          <LinearGradient
            colors={[NUTRITION_ACCENT, '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: spacing.md, alignItems: 'center' }}
          >
            <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>영양 플랜 시작하기</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function StepItem({ number, title }: { number: number; title: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: NUTRITION_ACCENT }]}>
        <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>{number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconContainer: { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.mlg },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: { fontSize: 26, fontWeight: typography.weight.bold, marginBottom: spacing.smx },
  subtitle: { fontSize: typography.size.base, textAlign: 'center', lineHeight: 24 },
  card: { borderRadius: radii.xl, padding: spacing.mlg, marginBottom: spacing.md },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  featureList: { gap: spacing.md },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.smx },
  featureEmoji: { fontSize: typography.size['2xl'] },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: typography.weight.semibold, marginBottom: spacing.xxs },
  featureDescription: { fontSize: 13 },
  stepList: { gap: spacing.smx },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.smx },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  stepTitle: { fontSize: 15 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
  },
  startButton: { borderRadius: radii.full },
  startButtonText: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
});
